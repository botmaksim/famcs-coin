package bot

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"

	"famcscoin-backend/internal/repository"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type Bot struct {
	api      *tgbotapi.BotAPI
	userRepo repository.UserRepository
}

func NewBot(token string, userRepo repository.UserRepository) (*Bot, error) {
	api, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, fmt.Errorf("failed to create bot: %w", err)
	}
	return &Bot{
		api:      api,
		userRepo: userRepo,
	}, nil
}

func (b *Bot) Start(ctx context.Context) {
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := b.api.GetUpdatesChan(u)

	for {
		select {
		case <-ctx.Done():
			return
		case update := <-updates:
			if update.Message == nil {
				continue
			}

			log.Printf("[BOT] Received message from UserID: %d in ChatID: %d. Text: %q", update.Message.From.ID, update.Message.Chat.ID, update.Message.Text)

			// Handle /tip commands in groups
			if strings.HasPrefix(update.Message.Text, "/tip") && update.Message.ReplyToMessage != nil {
				log.Printf("[BOT] /tip command detected from UserID: %d to UserID: %d", update.Message.From.ID, update.Message.ReplyToMessage.From.ID)
				b.handleTipCommand(ctx, update.Message)
			}
		}
	}
}

func (b *Bot) handleTipCommand(ctx context.Context, msg *tgbotapi.Message) {
	parts := strings.Fields(msg.Text)
	if len(parts) < 2 {
		return
	}

	amountStr := parts[1]
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || amount <= 0 {
		return // Invalid amount
	}

	senderID := msg.From.ID
	receiverID := msg.ReplyToMessage.From.ID

	if senderID == receiverID {
		return // Cannot tip yourself
	}

	// First, check if receiver is registered
	receiver, err := b.userRepo.GetUserByID(ctx, receiverID)
	if err != nil || receiver == nil {
		log.Printf("[BOT] /tip failed: Receiver %d is not registered", receiverID)
		// Receiver not registered, send PM to sender
		pm := tgbotapi.NewMessage(senderID, fmt.Sprintf("Этот студент еще не в игре! Отправь ему эту реф-ссылку: https://t.me/%s?startapp=ref_%d", b.api.Self.UserName, senderID))
		b.api.Send(pm)
		return
	}

	// Process tip transaction
	err = b.userRepo.TipUser(ctx, senderID, receiverID, amount)
	if err != nil {
		log.Printf("[BOT] /tip transaction failed from %d to %d: %v", senderID, receiverID, err)
		// Possibly log error or notify sender if we want (e.g., insufficient balance)
		if err.Error() == "insufficient balance" {
			pm := tgbotapi.NewMessage(senderID, "Недостаточно коинов для перевода.")
			b.api.Send(pm)
		}
		return
	}
	
	log.Printf("[BOT] /tip successful: %d sent %f coins to %d", senderID, amount, receiverID)

	// Delete the /tip message from group
	delMsg := tgbotapi.NewDeleteMessage(msg.Chat.ID, msg.MessageID)
	b.api.Request(delMsg)

	// Send silent notification to receiver
	senderName := msg.From.FirstName
	if msg.From.LastName != "" {
		senderName += " " + msg.From.LastName
	}

	notification := tgbotapi.NewMessage(receiverID, fmt.Sprintf("Вам перевели %.0f коинов от %s!", amount, senderName))
	notification.DisableNotification = true
	b.api.Send(notification)
}
