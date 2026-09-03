package bot

import (
	"context"
	"fmt"
	"log"
	"strings"

	"famcscoin-backend/internal/repository"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type Bot struct {
	api        *tgbotapi.BotAPI
	userRepo   repository.UserRepository
}

func NewBot(token string, userRepo repository.UserRepository) (*Bot, error) {
	api, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, fmt.Errorf("failed to create bot: %w", err)
	}
	return &Bot{
		api:        api,
		userRepo:   userRepo,
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



			// Handle /start command
			if strings.HasPrefix(update.Message.Text, "/start") {
				log.Printf("[BOT] /start command detected from UserID: %d", update.Message.From.ID)
				b.handleStartCommand(ctx, update.Message)
			}
		}
	}
}

func (b *Bot) handleStartCommand(ctx context.Context, msg *tgbotapi.Message) {
	text := "Привет! Добро пожаловать в факультетский кликер FAMCS Coin.\n\nЗдесь ты можешь тапать, зарабатывать коины, покупать пассивный доход и делать ставки на факультетские события!\n\n🌐 Веб-сайт проекта (лидерборд, новости и правила): https://coin.mybsu.online\n\nЖми кнопку ниже, чтобы войти в приложение."
	reply := tgbotapi.NewMessage(msg.Chat.ID, text)
	
	// URLs
	webAppURL := "https://t.me/famcs_coin_bot/app" 
	webSiteURL := "https://coin.mybsu.online"
	
	btnApp := tgbotapi.InlineKeyboardButton{
		Text: "Играть",
		URL: &webAppURL,
	}
	btnWeb := tgbotapi.InlineKeyboardButton{
		Text: "Веб-сайт",
		URL: &webSiteURL,
	}
	reply.ReplyMarkup = tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(btnApp, btnWeb),
	)

	b.api.Send(reply)
}
