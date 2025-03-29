import { Game } from 'phaser';

/**
 * GlowPipeline-Klasse
 * Implementiert einen Glow-Effekt für Sprites
 */
export class GlowPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    private _intensity: number;

    constructor(game: Game) {
        super({
            game,
            renderTarget: true,
            fragShader: `
                precision mediump float;
                uniform sampler2D uMainSampler;
                uniform float intensity;
                varying vec2 outTexCoord;

                void main() {
                    vec4 color = texture2D(uMainSampler, outTexCoord);
                    vec4 glow = vec4(0.0);
                    
                    // Dezenter Blur für subtilen Glow-Effekt
                    for(float x = -3.0; x <= 3.0; x++) {
                        for(float y = -3.0; y <= 3.0; y++) {
                            vec2 coord = outTexCoord + vec2(x, y) * 0.003;
                            glow += texture2D(uMainSampler, coord) * 0.025;
                        }
                    }
                    
                    // Dezenter Cyan-Glow
                    vec4 glowColor = vec4(0.0, 1.0, 1.0, 1.0);
                    gl_FragColor = color + glow * glowColor * intensity;
                }
            `
        });

        this._intensity = 1.0; // Zurück zur ursprünglichen Intensität
    }

    onBoot() {
        this.set2f('resolution', this.renderer.width, this.renderer.height);
        this.set1f('intensity', this._intensity);
    }

    onPreRender() {
        this.set1f('intensity', this._intensity);
    }

    setIntensity(value: number) {
        this._intensity = value;
        return this;
    }
} 