package bot

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"

	"famcscoin-backend/internal/config"
	"famcscoin-backend/internal/repository"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type Bot struct {
	api        *tgbotapi.BotAPI
	userRepo   repository.UserRepository
	cryptoRepo repository.CryptoRepository
}

func NewBot(token string, userRepo repository.UserRepository, cryptoRepo repository.CryptoRepository) (*Bot, error) {
	api, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, fmt.Errorf("failed to create bot: %w", err)
	}
	return &Bot{
		api:        api,
		userRepo:   userRepo,
		cryptoRepo: cryptoRepo,
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

			// Handle /withdraw command
			if strings.HasPrefix(update.Message.Text, "/withdraw") {
				log.Printf("[BOT] /withdraw command detected from UserID: %d", update.Message.From.ID)
				b.handleWithdrawCommand(ctx, update.Message)
			}

			// Handle /deposit command
			if strings.HasPrefix(update.Message.Text, "/deposit") {
				log.Printf("[BOT] /deposit command detected from UserID: %d", update.Message.From.ID)
				b.handleDepositCommand(ctx, update.Message)
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

func (b *Bot) handleWithdrawCommand(ctx context.Context, msg *tgbotapi.Message) {
	parts := strings.Fields(msg.Text)
	if len(parts) < 2 {
		reply := tgbotapi.NewMessage(msg.Chat.ID, "Укажите сумму для вывода. Пример: /withdraw 10000")
		b.api.Send(reply)
		return
	}

	amountStr := parts[1]
	amount, err := strconv.ParseInt(amountStr, 10, 64)
	if err != nil || amount <= 0 {
		reply := tgbotapi.NewMessage(msg.Chat.ID, "Некорректная сумма. Укажите положительное число. Пример: /withdraw 10000")
		b.api.Send(reply)
		return
	}

	err = b.cryptoRepo.Withdraw(ctx, msg.From.ID, amount)
	if err != nil {
		if err == repository.ErrNoWallet {
			reply := tgbotapi.NewMessage(msg.Chat.ID, "У вас не привязан кошелек! 💳 Откройте приложение (кнопка 'Играть'), перейдите во вкладку 'Кошелек' и укажите свой адрес.")
			b.api.Send(reply)
			return
		}
		if err.Error() == "insufficient balance" {
			reply := tgbotapi.NewMessage(msg.Chat.ID, "Недостаточно коинов на балансе.")
			b.api.Send(reply)
			return
		}
		
		log.Printf("[BOT] /withdraw error: %v", err)
		reply := tgbotapi.NewMessage(msg.Chat.ID, "Ошибка при обработке запроса. Попробуйте позже.")
		b.api.Send(reply)
		return
	}

	reply := tgbotapi.NewMessage(msg.Chat.ID, fmt.Sprintf("✅ Заявка на вывод %d FAMCS создана! Ожидайте подтверждения смарт-контрактом. Отследить статус можно в приложении.", amount))
	b.api.Send(reply)
}

func (b *Bot) handleDepositCommand(ctx context.Context, msg *tgbotapi.Message) {
	parts := strings.Fields(msg.Text)
	if len(parts) < 2 {
		contractAddr := config.SMART_CONTRACT_ADDRESS
		if contractAddr == "" {
			contractAddr = "0x..." // Fallback
		}
		
		text := fmt.Sprintf("📥 **Пополнение баланса**\n\nОтправьте токены FAMCS на адрес смарт-контракта:\n`%s`\n\nПосле перевода скопируйте хэш транзакции (TxHash) и отправьте боту команду в формате:\n`/deposit <ваш_хэш>`", contractAddr)
		
		reply := tgbotapi.NewMessage(msg.Chat.ID, text)
		reply.ParseMode = "Markdown"
		b.api.Send(reply)
		return
	}

	txHash := parts[1]
	
	err := b.cryptoRepo.SubmitDepositTx(ctx, msg.From.ID, txHash)
	if err != nil {
		if err == repository.ErrDuplicateTx {
			reply := tgbotapi.NewMessage(msg.Chat.ID, "⚠️ Этот хэш транзакции уже был отправлен на проверку.")
			b.api.Send(reply)
			return
		}
		log.Printf("[BOT] /deposit error: %v", err)
		reply := tgbotapi.NewMessage(msg.Chat.ID, "Ошибка при обработке запроса. Попробуйте позже.")
		b.api.Send(reply)
		return
	}

	reply := tgbotapi.NewMessage(msg.Chat.ID, "✅ Заявка на депозит принята! Мы проверяем транзакцию в блокчейне. Как только она подтвердится, коины будут зачислены на ваш баланс.")
	b.api.Send(reply)
}
