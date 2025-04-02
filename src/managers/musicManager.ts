import { Scene } from 'phaser';
import { EventBus } from '../utils/eventBus';

export class MusicManager {
    private static instance: MusicManager;
    private scene: Scene;
    private currentMusic: Phaser.Sound.HTML5AudioSound | null = null;
    private gameplayTracks: string[] = ['00', '01', '02'];
    private currentTrackIndex: number = -1;
    private volume: number = 0.5;
    private isMuted: boolean = false;

    private constructor() {}

    public static getInstance(): MusicManager {
        if (!MusicManager.instance) {
            MusicManager.instance = new MusicManager();
        }
        return MusicManager.instance;
    }

    public init(scene: Scene): void {
        this.scene = scene;
        this.loadSettings();
    }

    public playMenuMusic(): void {
        this.stopCurrentMusic();
        this.currentMusic = this.scene.sound.add('title', {
            loop: true,
            volume: this.volume
        }) as Phaser.Sound.HTML5AudioSound;
        this.currentMusic.play();
    }

    public playRandomGameplayTrack(): void {
        this.stopCurrentMusic();
        
        // Zufälligen Track auswählen, aber nicht den gleichen wie zuvor
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.gameplayTracks.length);
        } while (newIndex === this.currentTrackIndex && this.gameplayTracks.length > 1);
        
        this.currentTrackIndex = newIndex;
        const trackKey = this.gameplayTracks[this.currentTrackIndex];
        
        this.currentMusic = this.scene.sound.add(trackKey, {
            loop: false,
            volume: this.volume
        }) as Phaser.Sound.HTML5AudioSound;
        
        this.currentMusic.play();
        
        // Event-Listener für das Ende des Tracks
        this.currentMusic.once('complete', () => {
            this.playRandomGameplayTrack();
        });
    }

    public stopCurrentMusic(): void {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic.destroy();
            this.currentMusic = null;
        }
    }

    public setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.volume);
        }
        this.saveSettings();
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.isMuted ? 0 : this.volume);
        }
        this.saveSettings();
        return this.isMuted;
    }

    public isMusicPlaying(): boolean {
        return this.currentMusic !== null && this.currentMusic.isPlaying;
    }

    private loadSettings(): void {
        const savedVolume = localStorage.getItem('musicVolume');
        const savedMuted = localStorage.getItem('musicMuted');
        
        if (savedVolume !== null) {
            this.volume = parseFloat(savedVolume);
        }
        
        if (savedMuted !== null) {
            this.isMuted = savedMuted === 'true';
        }
    }

    private saveSettings(): void {
        localStorage.setItem('musicVolume', this.volume.toString());
        localStorage.setItem('musicMuted', this.isMuted.toString());
    }
} 