package main

import (
	"log"

	"github.com/protest-tracker/internal/api"
	"github.com/protest-tracker/internal/config"
	"github.com/protest-tracker/internal/database"
)

func main() {
	cfg := config.Load()
	db, err := database.Initialize(cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	server := api.NewServer(db, cfg)
	server.Start()
}
