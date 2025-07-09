use rand::seq::SliceRandom;
use rand::SeedableRng;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// Import the `console.log` function from the `console` module
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro for easier console logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Suit {
    Hearts,
    Diamonds,
    Clubs,
    Spades,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Rank {
    Ace,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Jack,
    Queen,
    King,
}

impl Rank {
    pub fn value(&self) -> u8 {
        match self {
            Rank::Ace => 1, // Will be handled specially for 1 or 11
            Rank::Two => 2,
            Rank::Three => 3,
            Rank::Four => 4,
            Rank::Five => 5,
            Rank::Six => 6,
            Rank::Seven => 7,
            Rank::Eight => 8,
            Rank::Nine => 9,
            Rank::Ten | Rank::Jack | Rank::Queen | Rank::King => 10,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Card {
    pub suit: Suit,
    pub rank: Rank,
}

impl Card {
    pub fn new(suit: Suit, rank: Rank) -> Self {
        Card { suit, rank }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hand {
    pub cards: Vec<Card>,
}

impl Hand {
    pub fn new() -> Self {
        Hand { cards: Vec::new() }
    }

    pub fn add_card(&mut self, card: Card) {
        self.cards.push(card);
    }

    pub fn calculate_score(&self) -> u8 {
        let mut score = 0;
        let mut aces = 0;

        for card in &self.cards {
            match card.rank {
                Rank::Ace => {
                    aces += 1;
                    score += 1;
                }
                _ => score += card.rank.value(),
            }
        }

        // Handle aces - try to use as many 11s as possible without busting
        for _ in 0..aces {
            if score + 10 <= 21 {
                score += 10;
            }
        }

        score
    }

    pub fn is_blackjack(&self) -> bool {
        self.cards.len() == 2 && self.calculate_score() == 21
    }

    pub fn is_busted(&self) -> bool {
        self.calculate_score() > 21
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deck {
    pub cards: Vec<Card>,
}

impl Deck {
    pub fn new() -> Self {
        let mut cards = Vec::new();

        for suit in [Suit::Hearts, Suit::Diamonds, Suit::Clubs, Suit::Spades] {
            for rank in [
                Rank::Ace,
                Rank::Two,
                Rank::Three,
                Rank::Four,
                Rank::Five,
                Rank::Six,
                Rank::Seven,
                Rank::Eight,
                Rank::Nine,
                Rank::Ten,
                Rank::Jack,
                Rank::Queen,
                Rank::King,
            ] {
                cards.push(Card::new(suit, rank));
            }
        }

        Deck { cards }
    }

    pub fn shuffle(&mut self) {
        let mut rng = rand::rngs::SmallRng::from_entropy();
        self.cards.shuffle(&mut rng);
    }

    pub fn deal_card(&mut self) -> Option<Card> {
        self.cards.pop()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PlayerAction {
    Hit,
    Stand,
    DoubleDown,
    Split,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GameState {
    WaitingForPlayers,
    PlayerTurn,
    DealerTurn,
    GameEnd,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub hand: Hand,
    pub bet: u32,
    pub balance: u32,
    pub is_active: bool,
}

impl Player {
    pub fn new(id: String, name: String, balance: u32) -> Self {
        Player {
            id,
            name,
            hand: Hand::new(),
            bet: 0,
            balance,
            is_active: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlackjackGame {
    pub deck: Deck,
    pub dealer_hand: Hand,
    pub players: Vec<Player>,
    pub current_player_index: usize,
    pub state: GameState,
}

#[wasm_bindgen]
pub struct GameEngine {
    game: BlackjackGame,
}

#[wasm_bindgen]
impl GameEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> GameEngine {
        console_log!("Creating new Blackjack game engine");

        let mut deck = Deck::new();
        deck.shuffle();

        GameEngine {
            game: BlackjackGame {
                deck,
                dealer_hand: Hand::new(),
                players: Vec::new(),
                current_player_index: 0,
                state: GameState::WaitingForPlayers,
            },
        }
    }

    #[wasm_bindgen]
    pub fn add_player(&mut self, id: &str, name: &str, balance: u32) -> bool {
        console_log!("Adding player: {} with balance: {}", name, balance);

        if self.game.players.len() >= 6 {
            return false; // Max 6 players
        }

        let player = Player::new(id.to_string(), name.to_string(), balance);
        self.game.players.push(player);
        true
    }

    #[wasm_bindgen]
    pub fn start_new_round(&mut self) -> Result<(), JsValue> {
        console_log!("Starting new round");

        if self.game.players.is_empty() {
            return Err(JsValue::from_str("No players in the game"));
        }

        // Reset hands
        self.game.dealer_hand = Hand::new();
        for player in &mut self.game.players {
            player.hand = Hand::new();
            player.is_active = true;
        }

        // Shuffle deck if running low
        if self.game.deck.cards.len() < 20 {
            self.game.deck = Deck::new();
            self.game.deck.shuffle();
        }

        // Deal initial cards
        for _ in 0..2 {
            for player in &mut self.game.players {
                if let Some(card) = self.game.deck.deal_card() {
                    player.hand.add_card(card);
                }
            }
            if let Some(card) = self.game.deck.deal_card() {
                self.game.dealer_hand.add_card(card);
            }
        }

        self.game.current_player_index = 0;
        self.game.state = GameState::PlayerTurn;

        Ok(())
    }

    #[wasm_bindgen]
    pub fn player_action(&mut self, player_id: &str, action: &str) -> Result<(), JsValue> {
        console_log!("Player {} action: {}", player_id, action);

        let player_index = self
            .game
            .players
            .iter()
            .position(|p| p.id == player_id)
            .ok_or_else(|| JsValue::from_str("Player not found"))?;

        if player_index != self.game.current_player_index {
            return Err(JsValue::from_str("Not this player's turn"));
        }

        let player = &mut self.game.players[player_index];

        match action {
            "hit" => {
                if let Some(card) = self.game.deck.deal_card() {
                    player.hand.add_card(card);
                }

                if player.hand.is_busted() {
                    player.is_active = false;
                    self.next_player();
                }
            }
            "stand" => {
                player.is_active = false;
                self.next_player();
            }
            "double_down" => {
                if player.hand.cards.len() == 2 && player.balance >= player.bet {
                    player.balance -= player.bet;
                    player.bet *= 2;

                    if let Some(card) = self.game.deck.deal_card() {
                        player.hand.add_card(card);
                    }

                    player.is_active = false;
                    self.next_player();
                } else {
                    return Err(JsValue::from_str("Cannot double down"));
                }
            }
            _ => return Err(JsValue::from_str("Invalid action")),
        }

        Ok(())
    }

    fn next_player(&mut self) {
        // Find next active player
        let mut next_index = self.game.current_player_index + 1;

        while next_index < self.game.players.len() {
            if self.game.players[next_index].is_active {
                self.game.current_player_index = next_index;
                return;
            }
            next_index += 1;
        }

        // No more active players, move to dealer turn
        self.game.state = GameState::DealerTurn;
        self.dealer_play();
    }

    fn dealer_play(&mut self) {
        console_log!("Dealer playing");

        // Dealer hits on 16 and stands on 17
        while self.game.dealer_hand.calculate_score() < 17 {
            if let Some(card) = self.game.deck.deal_card() {
                self.game.dealer_hand.add_card(card);
            }
        }

        self.game.state = GameState::GameEnd;
        self.calculate_winners();
    }

    fn calculate_winners(&mut self) {
        console_log!("Calculating winners");

        let dealer_score = self.game.dealer_hand.calculate_score();
        let dealer_busted = dealer_score > 21;
        let dealer_blackjack = self.game.dealer_hand.is_blackjack();

        for player in &mut self.game.players {
            let player_score = player.hand.calculate_score();
            let player_busted = player_score > 21;
            let player_blackjack = player.hand.is_blackjack();

            if player_busted {
                // Player loses, bet is already taken
                continue;
            }

            if player_blackjack && !dealer_blackjack {
                // Player wins 3:2
                player.balance += player.bet + (player.bet * 3 / 2);
            } else if !player_blackjack && dealer_blackjack {
                // Player loses, bet is already taken
                continue;
            } else if player_blackjack && dealer_blackjack {
                // Push
                player.balance += player.bet;
            } else if dealer_busted || player_score > dealer_score {
                // Player wins 1:1
                player.balance += player.bet * 2;
            } else if player_score == dealer_score {
                // Push
                player.balance += player.bet;
            }
            // If dealer score > player score, player loses (bet already taken)
        }
    }

    #[wasm_bindgen]
    pub fn get_game_state(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.game).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen]
    pub fn get_current_player_id(&self) -> Option<String> {
        if self.game.current_player_index < self.game.players.len() {
            Some(self.game.players[self.game.current_player_index].id.clone())
        } else {
            None
        }
    }
}
