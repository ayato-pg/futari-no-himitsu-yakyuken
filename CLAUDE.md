# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Ren'Py 8.2 visual novel game featuring a strip rock-paper-scissors (野球拳) minigame. The game targets multiple platforms (PC/macOS/Steam Deck/Android 10+/iOS 15+) with a fixed landscape orientation.

## Game Structure

### Core Game Flow
```
TITLE → PROLOGUE → STRIP_JANKEN → END_A/B/C
```
- END_A: Player wins (5 wins first)
- END_B: Player loses (opponent gets 5 wins first)  
- END_C: Draw condition (4-4 tie, then 1 final round)

### Strip Janken (野球拳) Minigame
- Maximum 9 rounds
- First to 5 wins takes victory
- 5 stripping stages: TOWEL → JACKET → CARDIGAN → INNER → FINALE
- Heart-based UI: 5 hearts per character, lose 1 per round loss
- Hand animation: 0.3s loop with click to confirm selection

## Development Commands

### Running the Game
```bash
# Launch Ren'Py SDK launcher
renpy.exe launcher

# Direct game launch (from game directory)
renpy.exe . 

# Build distributions
renpy.exe launcher distribute
```

### Testing
```bash
# Enable developer mode for console access
# Add to options.rpy: config.developer = True

# Lint check for script errors
renpy.exe . lint

# Test specific routes
# Use Shift+R for auto-reload during development
```

## Project Architecture

### Directory Structure
```
game/
├── script.rpy              # Main game script
├── options.rpy             # Configuration and build settings
├── gui.rpy                 # GUI customization
├── screens.rpy             # Screen definitions
├── janken_minigame.rpy     # Strip janken game logic
├── translations/           # Multi-language support
│   ├── japanese/          
│   └── english/
├── images/                 # Visual assets
│   ├── characters/         # 8 PNGs (4 outfits × 2 expressions)
│   ├── backgrounds/        # 5 JPGs (indoor scenes)
│   └── cg/                # 15 PSDs for special scenes
└── audio/                  # Sound assets
    ├── bgm/               # bgm_main.ogg, bgm_janken.ogg
    └── se/                # 20 sound effects
```

### Key Implementation Details

#### Janken Game State Management
```python
default player_wins = 0
default opponent_wins = 0  
default current_strip_stage = "TOWEL"
default strip_stages = ["TOWEL", "JACKET", "CARDIGAN", "INNER", "FINALE"]
```

#### UI Color Scheme
- Primary: #FF6B7D (Coral Pink)
- Accent: #7ED6C4 (Mint)
- Font: Rounded M+ 1c

#### Save System
- 12 save slots + autosave
- Persistent data for unlocked CGs/endings

#### Settings Screen Requirements
- Volume controls (BGM/SE/Voice)
- Text speed adjustment
- Language toggle (JP/EN)

## Asset Specifications

### Images
- Characters: 1920x1080 PNG with transparency
- Backgrounds: 1920x1080 JPG
- CG: 1920x1080 PSD (layered for variations)

### Audio
- BGM: OGG Vorbis, looped
- SE: WAV, 44.1kHz

## Critical Requirements

### Performance
- Target 60 FPS on Steam Deck
- Smooth transitions between scenes
- Responsive touch/mouse/gamepad controls

### Localization
- All text must use translation system
- UI must not break when switching languages
- Font must support both Japanese and English characters

### Sound Implementation
- se_click.wav plays on ALL interactions (text advance, buttons)
- BGM crossfade between scenes
- Separate volume controls for BGM/SE

## Common Development Tasks

### Adding New Dialogue
```renpy
label scene_name:
    show character_sprite
    character "Dialogue text here"
    return
```

### Implementing Choice Menu
```renpy
menu:
    "Choice 1":
        jump choice1_label
    "Choice 2":
        jump choice2_label
```

### Strip Stage Progression
```renpy
if opponent_wins >= player_wins:
    $ current_strip_stage = strip_stages[min(opponent_wins, 4)]
    show character [current_strip_stage]
```

## Build Configuration Notes

- Ensure `config.name` matches across all platforms
- Set `config.version` before each release
- Configure `build.classify` to exclude development files
- Test Android APK on actual device (not just emulator)
- iOS build requires Xcode signing configuration