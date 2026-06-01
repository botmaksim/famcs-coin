package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"

	"famcscoin-backend/internal/models"
	"famcscoin-backend/internal/repository"
)

type TaskAdminHandler struct {
	taskRepo repository.TaskRepository
}

func NewTaskAdminHandler(taskRepo repository.TaskRepository) *TaskAdminHandler {
	return &TaskAdminHandler{taskRepo: taskRepo}
}

func (h *TaskAdminHandler) GetTasks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tasks, err := h.taskRepo.GetAllTasks(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func (h *TaskAdminHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var task models.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Validate fields
	if task.Title == "" || task.Description == "" {
		http.Error(w, "Title and Description are required", http.StatusBadRequest)
		return
	}
	if task.RewardCoins <= 0 {
		http.Error(w, "Reward must be positive", http.StatusBadRequest)
		return
	}

	// Secure URL validation
	parsedURL, err := url.ParseRequestURI(task.LinkURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https" && parsedURL.Scheme != "tg") {
		http.Error(w, "Invalid link URL, must be http, https or tg scheme", http.StatusBadRequest)
		return
	}
	task.LinkURL = parsedURL.String()

	if err := h.taskRepo.CreateTask(r.Context(), &task); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func (h *TaskAdminHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Path[len("/api/admin/tasks/"):]
	taskID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var task models.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	task.ID = taskID

	// Validate fields
	if task.Title == "" || task.Description == "" {
		http.Error(w, "Title and Description are required", http.StatusBadRequest)
		return
	}
	if task.RewardCoins <= 0 {
		http.Error(w, "Reward must be positive", http.StatusBadRequest)
		return
	}

	// Secure URL validation
	parsedURL, err := url.ParseRequestURI(task.LinkURL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https" && parsedURL.Scheme != "tg") {
		http.Error(w, "Invalid link URL, must be http, https or tg scheme", http.StatusBadRequest)
		return
	}
	task.LinkURL = parsedURL.String()

	if err := h.taskRepo.UpdateTask(r.Context(), &task); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}

func (h *TaskAdminHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Path[len("/api/admin/tasks/"):]
	taskID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	if err := h.taskRepo.DeleteTask(r.Context(), taskID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
}
