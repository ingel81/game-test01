import { Constants } from '../utils/constants';
import { AssetManager, AssetKey } from '../utils/assetManager';

/**
 * PlanetsBackground-Klasse
 * Erstellt und verwaltet nicht-spielrelevante Planeten im Hintergrund
 */
export class PlanetsBackground {
  private scene: Phaser.Scene;
  private planets: Phaser.GameObjects.Group;
  private nextPlanetTime: number = 0;
  private spawnRateMin: number = 12000;  // Erhöht auf 12 Sekunden für seltenere Planeten
  private spawnRateMax: number = 35000;  // Erhöht auf 35 Sekunden
  private maxPlanets: number = 2;        // Reduziert auf maximal 2 Planeten gleichzeitig
  private minDistanceY: number = 300;    // Mindestabstand zwischen Planeten in Y-Richtung
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.planets = this.scene.add.group({
      // Setze maxSize, um die Anzahl der gleichzeitigen Planeten zu begrenzen
      maxSize: this.maxPlanets
    });
    
    // Setze den ersten Spawn-Timer
    this.resetSpawnTimer();
    
    // Initial einen Planeten setzen, damit direkt etwas zu sehen ist
    this.spawnPlanet();
  }
  
  /**
   * Aktualisiert die Planeten im Hintergrund
   */
  public update(time: number, delta: number): void {
    // Prüfe, ob es Zeit ist, einen neuen Planeten zu spawnen
    if (time > this.nextPlanetTime && this.planets.countActive() < this.maxPlanets) {
      // Prüfe, ob genügend Abstand zu vorhandenen Planeten besteht
      if (this.hasEnoughSpace()) {
        this.spawnPlanet();
      }
      this.resetSpawnTimer();
    }
    
    // Bewege alle Planeten von rechts nach links
    this.planets.children.each((planet: Phaser.GameObjects.GameObject) => {
      const planetImage = planet as Phaser.GameObjects.Image;
      
      // Planeten schneller bewegen (Faktor 5)
      const speed = planetImage.getData('speed');
      planetImage.x -= speed * (delta / 1000) * 5;
      
      // Rotiere den Planeten, falls eine Rotationsgeschwindigkeit gesetzt ist
      const rotationSpeed = planetImage.getData('rotationSpeed');
      if (rotationSpeed) {
        planetImage.rotation += rotationSpeed * (delta / 1000);
      }
      
      // Wenn der Planet den linken Bildschirmrand verlässt, entferne ihn
      if (planetImage.x < -planetImage.width) {
        planetImage.destroy();
      }
      
      return true;
    });
  }
  
  /**
   * Prüft, ob genügend Abstand zu vorhandenen Planeten besteht
   */
  private hasEnoughSpace(): boolean {
    if (this.planets.countActive() === 0) {
      return true; // Keine Planeten vorhanden, also genug Platz
    }
    
    // Wähle eine zufällige Y-Position
    const newY = Phaser.Math.Between(100, this.scene.scale.height - 100);
    
    // Prüfe den Abstand zu allen vorhandenen Planeten
    let hasSpace = true;
    
    this.planets.children.each((planet: Phaser.GameObjects.GameObject) => {
      const planetImage = planet as Phaser.GameObjects.Image;
      const distance = Math.abs(planetImage.y - newY);
      
      if (distance < this.minDistanceY) {
        hasSpace = false;
        return false; // Beende die Schleife vorzeitig
      }
      
      return true;
    });
    
    return hasSpace;
  }
  
  /**
   * Erzeugt einen neuen Planeten am rechten Bildschirmrand
   */
  private spawnPlanet(): void {
    // Prüfe, ob wir noch Platz für einen weiteren Planeten haben
    if (this.planets.countActive() >= this.maxPlanets) {
      return;
    }
    
    // Wähle zufällig einen der verfügbaren Planeten
    const planetNumber = Phaser.Math.Between(1, 16);
    const assetManager = AssetManager.getInstance();
    const planetKey = assetManager.getKey(this.getPlanetAssetKey(planetNumber));
    
    // Bestimme zufällige Position und Größe
    const y = Phaser.Math.Between(100, this.scene.scale.height - 100);
    const scale = Phaser.Math.FloatBetween(0.2, 0.5); // Etwas kleinere Planeten für bessere Performance
    
    // Erstelle den Planeten komplett außerhalb des sichtbaren Bereichs
    const planet = this.scene.add.image(
      this.scene.scale.width + 300, // Noch weiter rechts für größere Planeten
      y,
      planetKey
    );
    
    // Konfiguriere den Planeten
    planet.setScale(0); // Starte mit Skalierung 0 für sanftes Einblenden
    planet.setAlpha(0); // Starte mit Transparenz für sanftes Einblenden
    planet.setDepth(-5); // Hinter dem Spieler, aber vor den Sternen
    
    // Geschwindigkeit - höher als vorher
    const speed = Phaser.Math.FloatBetween(12, 25);
    planet.setData('speed', speed);
    
    // Füge eine leichte Rotation hinzu für mehr Dynamik
    planet.setData('rotationSpeed', Phaser.Math.FloatBetween(-0.02, 0.02));
    
    // Sanftes Einblenden des Planeten mit Animation
    this.scene.tweens.add({
      targets: planet,
      scale: scale,
      alpha: 0.7,
      duration: 1500,
      ease: 'Sine.easeOut'
    });
    
    // Füge den Planeten zur Gruppe hinzu
    this.planets.add(planet);
  }
  
  /**
   * Gibt den AssetKey für eine Planeten-Nummer zurück
   */
  private getPlanetAssetKey(number: number): AssetKey {
    switch (number) {
      case 1: return AssetKey.PLANET_1;
      case 2: return AssetKey.PLANET_2;
      case 3: return AssetKey.PLANET_3;
      case 4: return AssetKey.PLANET_4;
      case 5: return AssetKey.PLANET_5;
      case 6: return AssetKey.PLANET_6;
      case 7: return AssetKey.PLANET_7;
      case 8: return AssetKey.PLANET_8;
      case 9: return AssetKey.PLANET_9;
      case 10: return AssetKey.PLANET_10;
      case 11: return AssetKey.PLANET_11;
      case 12: return AssetKey.PLANET_12;
      case 13: return AssetKey.PLANET_13;
      case 14: return AssetKey.PLANET_14;
      case 15: return AssetKey.PLANET_15;
      case 16: return AssetKey.PLANET_16;
      default: return AssetKey.PLANET_1;
    }
  }
  
  /**
   * Setzt den Timer für den nächsten Planeten zurück
   */
  private resetSpawnTimer(): void {
    this.nextPlanetTime = this.scene.time.now + 
      Phaser.Math.Between(this.spawnRateMin, this.spawnRateMax);
  }
} 