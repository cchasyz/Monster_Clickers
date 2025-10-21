package models

type GameData struct {
	ID           uint `gorm:"primaryKey" json:"id"`
	UserID       uint `gorm:"column:user_id" json:"user_id"`
	MonsterShard int  `gorm:"column:MonsterShard" json:"monster_shard"`
	ClickPower   int  `gorm:"column:ClickPower" json:"click_power"`
	HelperCost   int  `gorm:"column:HelperCost" json:"helper_cost"`
	SoulShards   int  `gorm:"column:SoulShards" json:"soul_shards"`
}