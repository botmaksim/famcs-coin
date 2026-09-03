package worker

import (
	"context"
	"testing"
	"time"
)

func TestStartEconomyWorker_Cancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel() // cancel immediately

	done := make(chan bool)
	go func() {
		StartEconomyWorker(ctx, nil)
		done <- true
	}()

	select {
	case <-done:
		// Succeeded cleanly
	case <-time.After(1 * time.Second):
		t.Fatal("worker did not terminate promptly upon context cancellation")
	}
}
