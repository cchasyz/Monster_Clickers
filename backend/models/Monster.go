package models

type Monster struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	UserID   uint   `json:"user_id"`
	Name     string `json:"name"`
	HP       int    `json:"hp"`
	PhotoURL string `json:"photo_url"`
	Reward   int    `json:"reward"`
	TokenID  string `gorm:"column:tokenID" json:"token_id"`
}