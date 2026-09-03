package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"famcscoin-backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestNewsHandler_GetNews(t *testing.T) {
	mockNewsRepo := new(MockNewsRepository)
	mockUserRepo := new(MockUserRepository)
	handler := NewNewsHandler(mockNewsRepo, mockUserRepo)

	t.Run("success_with_query_voter", func(t *testing.T) {
		expectedNews := []models.NewsItem{
			{
				ID:            1,
				Title:         "Новый опрос",
				Content:       "Описание опроса",
				Status:        "open",
				LikesCount:    5,
				DislikesCount: 1,
				CreatedAt:     time.Now(),
			},
		}
		mockNewsRepo.On("GetNews", mock.Anything, "guest:123").Return(expectedNews, nil).Once()

		req := httptest.NewRequest(http.MethodGet, "/api/news?voter_id=guest:123", nil)
		rec := httptest.NewRecorder()

		handler.GetNews(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		var resp []models.NewsItem
		err := json.NewDecoder(rec.Body).Decode(&resp)
		assert.NoError(t, err)
		assert.Len(t, resp, 1)
		assert.Equal(t, "Новый опрос", resp[0].Title)
	})

	t.Run("success_with_tg_context", func(t *testing.T) {
		mockNewsRepo.On("GetNews", mock.Anything, "tg:999").Return([]models.NewsItem{}, nil).Once()

		req := httptest.NewRequest(http.MethodGet, "/api/news", nil)
		ctx := context.WithValue(req.Context(), "tg_id", int64(999))
		req = req.WithContext(ctx)
		rec := httptest.NewRecorder()

		handler.GetNews(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("repo_error", func(t *testing.T) {
		mockNewsRepo.On("GetNews", mock.Anything, "").Return(nil, errors.New("db error")).Once()

		req := httptest.NewRequest(http.MethodGet, "/api/news", nil)
		rec := httptest.NewRecorder()

		handler.GetNews(rec, req)

		assert.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}

func TestNewsHandler_VoteNews(t *testing.T) {
	mockNewsRepo := new(MockNewsRepository)
	mockUserRepo := new(MockUserRepository)
	handler := NewNewsHandler(mockNewsRepo, mockUserRepo)

	t.Run("successful_vote", func(t *testing.T) {
		voteType := "like"
		mockNewsRepo.On("VoteNews", mock.Anything, 1, "tg:12345", "like").Return(10, 2, &voteType, nil).Once()

		body := map[string]interface{}{
			"news_id":   1,
			"vote_type": "like",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/news/vote", bytes.NewReader(jsonBytes))
		req = req.WithContext(context.WithValue(req.Context(), "tg_id", int64(12345)))
		rec := httptest.NewRecorder()

		handler.VoteNews(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		var resp map[string]interface{}
		json.NewDecoder(rec.Body).Decode(&resp)
		assert.Equal(t, "ok", resp["status"])
		assert.Equal(t, float64(10), resp["likes_count"])
	})

	t.Run("unauthorized_without_tg_id", func(t *testing.T) {
		body := map[string]interface{}{
			"news_id":   1,
			"vote_type": "like",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/news/vote", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.VoteNews(rec, req)
		assert.Equal(t, http.StatusUnauthorized, rec.Code)
	})

	t.Run("invalid_json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/news/vote", bytes.NewReader([]byte("bad json")))
		req = req.WithContext(context.WithValue(req.Context(), "tg_id", int64(12345)))
		rec := httptest.NewRecorder()

		handler.VoteNews(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("vote_on_closed_poll_error", func(t *testing.T) {
		mockNewsRepo.On("VoteNews", mock.Anything, 2, "tg:12345", "like").Return(0, 0, nil, errors.New("голосование по этой теме уже завершено")).Once()

		body := map[string]interface{}{
			"news_id":   2,
			"vote_type": "like",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/news/vote", bytes.NewReader(jsonBytes))
		req = req.WithContext(context.WithValue(req.Context(), "tg_id", int64(12345)))
		rec := httptest.NewRecorder()

		handler.VoteNews(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
		assert.Contains(t, rec.Body.String(), "голосование по этой теме уже завершено")
	})
}

func TestNewsHandler_CreateNews(t *testing.T) {
	mockNewsRepo := new(MockNewsRepository)
	mockUserRepo := new(MockUserRepository)
	handler := NewNewsHandler(mockNewsRepo, mockUserRepo)

	t.Run("success", func(t *testing.T) {
		img := "https://example.com/img.png"
		created := &models.NewsItem{
			ID:       1,
			Title:    "Тест",
			Content:  "Контент",
			ImageURL: &img,
			Status:   "open",
		}
		mockNewsRepo.On("CreateNews", mock.Anything, "Тест", "Контент", &img, "open").Return(created, nil).Once()

		body := map[string]interface{}{
			"title":     "Тест",
			"content":   "Контент",
			"image_url": img,
			"status":    "open",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.CreateNews(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		var item models.NewsItem
		json.NewDecoder(rec.Body).Decode(&item)
		assert.Equal(t, 1, item.ID)
	})

	t.Run("missing_fields", func(t *testing.T) {
		body := map[string]interface{}{
			"title": "",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.CreateNews(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})

	t.Run("repo_error", func(t *testing.T) {
		mockNewsRepo.On("CreateNews", mock.Anything, "Тест", "Контент", (*string)(nil), "").Return(nil, errors.New("db error")).Once()

		body := map[string]interface{}{
			"title":   "Тест",
			"content": "Контент",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.CreateNews(rec, req)
		assert.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}

func TestNewsHandler_UpdateNews(t *testing.T) {
	mockNewsRepo := new(MockNewsRepository)
	mockUserRepo := new(MockUserRepository)
	handler := NewNewsHandler(mockNewsRepo, mockUserRepo)

	t.Run("success", func(t *testing.T) {
		updated := &models.NewsItem{
			ID:      1,
			Title:   "Upd Title",
			Content: "Upd Content",
			Status:  "in_progress",
		}
		mockNewsRepo.On("UpdateNews", mock.Anything, 1, "Upd Title", "Upd Content", (*string)(nil), "in_progress", (*string)(nil), (*string)(nil)).Return(updated, nil).Once()

		body := map[string]interface{}{
			"id":      1,
			"title":   "Upd Title",
			"content": "Upd Content",
			"status":  "in_progress",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPut, "/api/admin/news", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.UpdateNews(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		var item models.NewsItem
		json.NewDecoder(rec.Body).Decode(&item)
		assert.Equal(t, "Upd Title", item.Title)
	})

	t.Run("invalid_id", func(t *testing.T) {
		body := map[string]interface{}{
			"id":      0,
			"title":   "Title",
			"content": "Content",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPut, "/api/admin/news", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.UpdateNews(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestNewsHandler_ClosePoll(t *testing.T) {
	mockNewsRepo := new(MockNewsRepository)
	mockUserRepo := new(MockUserRepository)
	handler := NewNewsHandler(mockNewsRepo, mockUserRepo)

	t.Run("success", func(t *testing.T) {
		verdict := "Принято"
		note := "В релиз"
		closed := &models.NewsItem{
			ID:          1,
			Status:      "in_progress",
			Verdict:     &verdict,
			VerdictNote: &note,
		}
		mockNewsRepo.On("ClosePoll", mock.Anything, 1, "in_progress", &verdict, &note).Return(closed, nil).Once()

		body := map[string]interface{}{
			"id":           1,
			"status":       "in_progress",
			"verdict":      verdict,
			"verdict_note": note,
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news/close", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.ClosePoll(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		var item models.NewsItem
		json.NewDecoder(rec.Body).Decode(&item)
		assert.Equal(t, "in_progress", item.Status)
	})

	t.Run("invalid_id", func(t *testing.T) {
		body := map[string]interface{}{
			"id": -1,
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news/close", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.ClosePoll(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestNewsHandler_DeleteNews(t *testing.T) {
	mockNewsRepo := new(MockNewsRepository)
	mockUserRepo := new(MockUserRepository)
	handler := NewNewsHandler(mockNewsRepo, mockUserRepo)

	t.Run("success_query_param", func(t *testing.T) {
		mockNewsRepo.On("DeleteNews", mock.Anything, 5).Return(nil).Once()

		req := httptest.NewRequest(http.MethodDelete, "/api/admin/news?id=5", nil)
		rec := httptest.NewRecorder()

		handler.DeleteNews(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("success_body_param", func(t *testing.T) {
		mockNewsRepo.On("DeleteNews", mock.Anything, 6).Return(nil).Once()

		body := map[string]interface{}{"id": 6}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodDelete, "/api/admin/news", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.DeleteNews(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("missing_id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/admin/news", bytes.NewReader([]byte("{}")))
		rec := httptest.NewRecorder()

		handler.DeleteNews(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)
	})
}

func TestNewsHandler_Header(t *testing.T) {
	mockNewsRepo := new(MockNewsRepository)
	mockUserRepo := new(MockUserRepository)
	handler := NewNewsHandler(mockNewsRepo, mockUserRepo)

	t.Run("get_header_success", func(t *testing.T) {
		header := &models.NewsHeaderContent{
			Title:    "Custom Title",
			Subtitle: "Custom Subtitle",
			Banner:   "Custom Banner",
		}
		mockNewsRepo.On("GetNewsHeader", mock.Anything).Return(header, nil).Once()

		req := httptest.NewRequest(http.MethodGet, "/api/news/header", nil)
		rec := httptest.NewRecorder()

		handler.GetNewsHeader(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		var res models.NewsHeaderContent
		json.NewDecoder(rec.Body).Decode(&res)
		assert.Equal(t, "Custom Title", res.Title)
	})

	t.Run("update_header_success", func(t *testing.T) {
		mockNewsRepo.On("UpdateNewsHeader", mock.Anything, "New Title", "New Sub", "New Banner").Return(nil).Once()

		body := map[string]interface{}{
			"title":    "New Title",
			"subtitle": "New Sub",
			"banner":   "New Banner",
		}
		jsonBytes, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news/header", bytes.NewReader(jsonBytes))
		rec := httptest.NewRecorder()

		handler.UpdateNewsHeader(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
	})

	t.Run("get_header_repo_error", func(t *testing.T) {
		mockNewsRepo.On("GetNewsHeader", mock.Anything).Return(nil, errors.New("db error")).Once()
		req := httptest.NewRequest(http.MethodGet, "/api/news/header", nil)
		rec := httptest.NewRecorder()
		handler.GetNewsHeader(rec, req)
		assert.Equal(t, http.StatusInternalServerError, rec.Code)
	})

	t.Run("update_header_repo_error", func(t *testing.T) {
		mockNewsRepo.On("UpdateNewsHeader", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(errors.New("db error")).Once()
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news/header", bytes.NewReader([]byte(`{"title":"T"}`)))
		rec := httptest.NewRecorder()
		handler.UpdateNewsHeader(rec, req)
		assert.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}

func TestNewsHandler_ExtraBranches(t *testing.T) {
	mockNewsRepo := new(MockNewsRepository)
	mockUserRepo := new(MockUserRepository)
	handler := NewNewsHandler(mockNewsRepo, mockUserRepo)

	t.Run("create_news_repo_error", func(t *testing.T) {
		mockNewsRepo.On("CreateNews", mock.Anything, "T", "C", mock.Anything, mock.Anything).Return(nil, errors.New("db error")).Once()
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news", bytes.NewReader([]byte(`{"title":"T","content":"C"}`)))
		rec := httptest.NewRecorder()
		handler.CreateNews(rec, req)
		assert.Equal(t, http.StatusInternalServerError, rec.Code)
	})

	t.Run("update_news_invalid_json_and_error", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/admin/news", bytes.NewReader([]byte(`invalid`)))
		rec := httptest.NewRecorder()
		handler.UpdateNews(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)

		req2 := httptest.NewRequest(http.MethodPut, "/api/admin/news", bytes.NewReader([]byte(`{"id":0}`)))
		rec2 := httptest.NewRecorder()
		handler.UpdateNews(rec2, req2)
		assert.Equal(t, http.StatusBadRequest, rec2.Code)

		mockNewsRepo.On("UpdateNews", mock.Anything, 1, "T", "C", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil, errors.New("db error")).Once()
		req3 := httptest.NewRequest(http.MethodPut, "/api/admin/news", bytes.NewReader([]byte(`{"id":1,"title":"T","content":"C"}`)))
		rec3 := httptest.NewRecorder()
		handler.UpdateNews(rec3, req3)
		assert.Equal(t, http.StatusInternalServerError, rec3.Code)
	})

	t.Run("close_poll_invalid_and_error", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/admin/news/close-poll", bytes.NewReader([]byte(`invalid`)))
		rec := httptest.NewRecorder()
		handler.ClosePoll(rec, req)
		assert.Equal(t, http.StatusBadRequest, rec.Code)

		req2 := httptest.NewRequest(http.MethodPost, "/api/admin/news/close-poll", bytes.NewReader([]byte(`{"id":0}`)))
		rec2 := httptest.NewRecorder()
		handler.ClosePoll(rec2, req2)
		assert.Equal(t, http.StatusBadRequest, rec2.Code)

		mockNewsRepo.On("ClosePoll", mock.Anything, 5, mock.Anything, mock.Anything, mock.Anything).Return(nil, errors.New("db error")).Once()
		req3 := httptest.NewRequest(http.MethodPost, "/api/admin/news/close-poll", bytes.NewReader([]byte(`{"id":5}`)))
		rec3 := httptest.NewRecorder()
		handler.ClosePoll(rec3, req3)
		assert.Equal(t, http.StatusInternalServerError, rec3.Code)
	})

	t.Run("delete_news_repo_error", func(t *testing.T) {
		mockNewsRepo.On("DeleteNews", mock.Anything, 10).Return(errors.New("db error")).Once()
		req := httptest.NewRequest(http.MethodDelete, "/api/admin/news", bytes.NewReader([]byte(`{"id":10}`)))
		rec := httptest.NewRecorder()
		handler.DeleteNews(rec, req)
		assert.Equal(t, http.StatusInternalServerError, rec.Code)
	})
}

