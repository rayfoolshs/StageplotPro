import React from 'react';
import { EquipmentShape } from '../types/stage';
import { CATEGORY_META, EQUIPMENT_CATALOG } from '../data/equipmentCatalog';

interface EquipmentSvgProps {
  type: EquipmentShape;
  width: number;
  height: number;
  surface: 'dark' | 'light' | 'blueprint';
  customColor?: string;
}

/**
 * Renders top-down architectural vector symbols in local coordinates (0, 0) to (width, height),
 * centered at (width/2, height/2). Designed for both live SVG canvas and high-DPI PNG export.
 */
export const EquipmentGraphic: React.FC<EquipmentSvgProps> = ({
  type,
  width,
  height,
  surface,
  customColor,
}) => {
  const def = EQUIPMENT_CATALOG.find((e) => e.type === type);
  const catMeta = def ? CATEGORY_META[def.category] : CATEGORY_META.staging;
  const accent = customColor || catMeta.accent;

  const isDark = surface === 'dark' || surface === 'blueprint';
  const bodyFill = isDark ? '#1E293B' : '#FFFFFF';
  const bodyFillAlt = isDark ? '#334155' : '#F1F5F9';
  const strokeColor = isDark ? '#E2E8F0' : '#1E293B';
  const mutedStroke = isDark ? '#64748B' : '#94A3B8';
  const woodFill = isDark ? '#451A03' : '#FEF3C7';

  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);

  switch (type) {
    case 'riser': {
      return (
        <g>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={4}
            fill={isDark ? 'rgba(51, 65, 85, 0.45)' : 'rgba(226, 232, 240, 0.65)'}
            stroke={mutedStroke}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <rect
            x={4}
            y={4}
            width={Math.max(0, width - 8)}
            height={Math.max(0, height - 8)}
            rx={2}
            fill="none"
            stroke={mutedStroke}
            strokeWidth={0.75}
            strokeOpacity={0.5}
          />
        </g>
      );
    }

    case 'choir_riser': {
      const tiers = 3;
      const tierH = height / tiers;
      return (
        <g>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={3}
            fill={isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.7)'}
            stroke={strokeColor}
            strokeWidth={1.25}
          />
          {[1, 2].map((i) => (
            <line
              key={i}
              x1={2}
              y1={i * tierH}
              x2={width - 2}
              y2={i * tierH}
              stroke={mutedStroke}
              strokeWidth={1}
            />
          ))}
          <text
            x={width - 6}
            y={height - 5}
            textAnchor="end"
            fontSize={Math.max(8, Math.min(11, tierH * 0.45))}
            fill={mutedStroke}
            fontFamily="JetBrains Mono, monospace"
          >
            3-TIER
          </text>
        </g>
      );
    }

    case 'drum_kit':
    case 'drum_compact': {
      const isFull = type === 'drum_kit';
      const kickW = width * 0.28;
      const kickH = height * 0.34;
      const snareR = minDim * 0.14;
      const floorR = minDim * 0.17;
      const tomR = minDim * 0.125;
      const hatR = minDim * 0.14;
      const crashR = minDim * 0.18;
      const rideR = minDim * 0.2;
      const cymbalFill = isDark ? 'rgba(217, 119, 6, 0.32)' : 'rgba(245, 158, 11, 0.25)';

      return (
        <g>
          {/* Drum rug outline */}
          <rect
            x={2}
            y={2}
            width={width - 4}
            height={height - 4}
            rx={6}
            fill={isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(241, 245, 249, 0.8)'}
            stroke={mutedStroke}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          {/* Drummer throne (upstage side, top of symbol when rotation=0 facing downstage) */}
          <circle cx={cx} cy={height * 0.18} r={minDim * 0.11} fill={bodyFillAlt} stroke={strokeColor} strokeWidth={1.25} />
          {/* Bass / Kick drum */}
          <rect
            x={cx - kickW / 2}
            y={cy - kickH * 0.15}
            width={kickW}
            height={kickH}
            rx={4}
            fill={bodyFill}
            stroke={accent}
            strokeWidth={1.75}
          />
          {/* Snare */}
          <circle cx={cx - width * 0.17} cy={cy - height * 0.12} r={snareR} fill={bodyFill} stroke={strokeColor} strokeWidth={1.5} />
          {/* Rack tom(s) */}
          <circle cx={cx - width * 0.08} cy={cy + height * 0.04} r={tomR} fill={bodyFill} stroke={strokeColor} strokeWidth={1.4} />
          {isFull && (
            <circle cx={cx + width * 0.09} cy={cy + height * 0.04} r={tomR * 1.05} fill={bodyFill} stroke={strokeColor} strokeWidth={1.4} />
          )}
          {/* Floor tom */}
          <circle cx={cx + width * 0.23} cy={cy - height * 0.08} r={floorR} fill={bodyFill} stroke={strokeColor} strokeWidth={1.5} />
          {/* Hi-Hat */}
          <circle cx={cx - width * 0.31} cy={cy + height * 0.02} r={hatR} fill={cymbalFill} stroke="#D97706" strokeWidth={1.3} />
          <circle cx={cx - width * 0.31} cy={cy + height * 0.02} r={2} fill="#D97706" />
          {/* Crash Left */}
          <circle cx={cx - width * 0.26} cy={cy + height * 0.25} r={crashR} fill={cymbalFill} stroke="#D97706" strokeWidth={1.3} />
          <circle cx={cx - width * 0.26} cy={cy + height * 0.25} r={2} fill="#D97706" />
          {/* Ride / Crash Right */}
          <circle cx={cx + width * 0.29} cy={cy + height * 0.18} r={rideR} fill={cymbalFill} stroke="#D97706" strokeWidth={1.3} />
          <circle cx={cx + width * 0.29} cy={cy + height * 0.18} r={2} fill="#D97706" />
        </g>
      );
    }

    case 'grand_piano': {
      // Top-down grand piano silhouette: keyboard at y = height (or top) -> let's put keyboard at y=0 (performer side) and tail extending downstage (+Y) or vice-versa;
      // Standard: rotation=0 means performer at top looking downstage or keyboard on left. Let's place keyboard along top edge (y=4..16) and curved body extending down!
      const kw = width * 0.86;
      const kx = (width - kw) / 2;
      return (
        <g>
          {/* Curved Rim */}
          <path
            d={`M ${kx} ${height * 0.22}
               L ${kx} ${height * 0.85}
               C ${kx} ${height * 0.98}, ${kx + kw * 0.38} ${height * 0.98}, ${kx + kw * 0.45} ${height * 0.78}
               C ${kx + kw * 0.55} ${height * 0.54}, ${kx + kw} ${height * 0.58}, ${kx + kw} ${height * 0.36}
               L ${kx + kw} ${height * 0.22} Z`}
            fill={isDark ? '#0F172A' : '#1E293B'}
            stroke={accent}
            strokeWidth={1.75}
          />
          {/* Soundboard / Strings detail */}
          <line x1={kx + 10} y1={height * 0.28} x2={kx + 14} y2={height * 0.86} stroke={mutedStroke} strokeWidth={0.8} />
          <line x1={kx + 20} y1={height * 0.28} x2={kx + 26} y2={height * 0.78} stroke={mutedStroke} strokeWidth={0.8} />
          {/* Keyboard lid */}
          <rect
            x={kx}
            y={height * 0.06}
            width={kw}
            height={height * 0.18}
            rx={2}
            fill="#FFFFFF"
            stroke={strokeColor}
            strokeWidth={1.4}
          />
          {/* Black keys rhythm */}
          {[0.12, 0.22, 0.38, 0.48, 0.58, 0.74, 0.84].map((p, idx) => (
            <rect
              key={idx}
              x={kx + kw * p}
              y={height * 0.06}
              width={Math.max(2, kw * 0.04)}
              height={height * 0.1}
              fill="#0F172A"
            />
          ))}
        </g>
      );
    }

    case 'upright_piano': {
      return (
        <g>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill={bodyFill} stroke={accent} strokeWidth={1.75} />
          <rect x={6} y={height * 0.52} width={width - 12} height={height * 0.38} rx={1.5} fill="#FFFFFF" stroke={strokeColor} strokeWidth={1} />
          {[0.14, 0.24, 0.4, 0.5, 0.6, 0.76, 0.86].map((p, i) => (
            <rect key={i} x={width * p} y={height * 0.52} width={Math.max(2, width * 0.035)} height={height * 0.22} fill="#0F172A" />
          ))}
        </g>
      );
    }

    case 'keyboard_single':
    case 'keyboard_double': {
      const isDouble = type === 'keyboard_double';
      return (
        <g>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill={bodyFill} stroke={accent} strokeWidth={1.6} />
          <rect x={6} y={height * 0.45} width={width - 12} height={height * 0.42} rx={1} fill="#FFFFFF" stroke={strokeColor} strokeWidth={0.9} />
          {[0.14, 0.23, 0.38, 0.47, 0.56, 0.72, 0.81].map((p, i) => (
            <rect key={i} x={width * p} y={height * 0.45} width={Math.max(2, width * 0.035)} height={height * 0.24} fill="#0F172A" />
          ))}
          {isDouble && (
            <rect
              x={8}
              y={5}
              width={width - 16}
              height={height * 0.34}
              rx={1.5}
              fill={bodyFillAlt}
              stroke={accent}
              strokeWidth={1}
            />
          )}
        </g>
      );
    }

    case 'guitar_amp':
    case 'bass_amp': {
      const isBass = type === 'bass_amp';
      return (
        <g>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill={bodyFill} stroke={accent} strokeWidth={1.75} />
          {/* Speaker grille front line (facing downstage = bottom edge) */}
          <line x1={4} y1={height - 6} x2={width - 4} y2={height - 6} stroke={accent} strokeWidth={2} />
          {/* Control knobs */}
          <circle cx={width * 0.25} cy={height * 0.38} r={2.2} fill={strokeColor} />
          <circle cx={width * 0.42} cy={height * 0.38} r={2.2} fill={strokeColor} />
          <circle cx={width * 0.59} cy={height * 0.38} r={2.2} fill={strokeColor} />
          <circle cx={width * 0.76} cy={height * 0.38} r={2.2} fill={strokeColor} />
          <text
            x={cx}
            y={height * 0.72}
            textAnchor="middle"
            fontSize={8}
            fontWeight="600"
            fill={accent}
            fontFamily="JetBrains Mono, monospace"
          >
            {isBass ? 'BASS' : 'AMP'}
          </text>
        </g>
      );
    }

    case 'acoustic_guitar': {
      const r1 = minDim * 0.22;
      const r2 = minDim * 0.17;
      return (
        <g>
          <circle cx={cx} cy={cy + r1 * 0.45} r={r1} fill={woodFill} stroke={accent} strokeWidth={1.5} />
          <circle cx={cx} cy={cy - r2 * 0.65} r={r2} fill={woodFill} stroke={accent} strokeWidth={1.5} />
          <circle cx={cx} cy={cy - r2 * 0.45} r={r2 * 0.35} fill={isDark ? '#0F172A' : '#451A03'} />
          <line x1={cx} y1={cy - r2 * 0.8} x2={cx} y2={4} stroke={strokeColor} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    }

    case 'pedalboard': {
      return (
        <g>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill={bodyFill} stroke={accent} strokeWidth={1.5} />
          {[0.18, 0.38, 0.58, 0.78].map((p, idx) => (
            <rect
              key={idx}
              x={width * p - 5}
              y={height * 0.22}
              width={10}
              height={height * 0.56}
              rx={1.5}
              fill={bodyFillAlt}
              stroke={strokeColor}
              strokeWidth={0.9}
            />
          ))}
        </g>
      );
    }

    case 'mic_boom':
    case 'mic_wireless':
    case 'mic_condenser': {
      const baseR = minDim * 0.24;
      return (
        <g>
          {/* Tripod / Round base */}
          {type === 'mic_wireless' ? (
            <circle cx={cx} cy={cy} r={baseR} fill={bodyFill} stroke={accent} strokeWidth={1.6} />
          ) : (
            <g stroke={strokeColor} strokeWidth={1.6} strokeLinecap="round">
              <line x1={cx} y1={cy} x2={cx} y2={cy - baseR * 1.1} />
              <line x1={cx} y1={cy} x2={cx - baseR * 0.95} y2={cy + baseR * 0.7} />
              <line x1={cx} y1={cy} x2={cx + baseR * 0.95} y2={cy + baseR * 0.7} />
            </g>
          )}
          {/* Boom arm pointing toward performer/upstage or downstage */}
          {type !== 'mic_wireless' && (
            <line x1={cx} y1={cy} x2={cx} y2={cy + minDim * 0.34} stroke={accent} strokeWidth={2} strokeLinecap="round" />
          )}
          {/* Capsule */}
          <circle
            cx={cx}
            cy={type === 'mic_wireless' ? cy : cy + minDim * 0.34}
            r={minDim * 0.12}
            fill={accent}
            stroke={isDark ? '#FFFFFF' : '#0F172A'}
            strokeWidth={1.1}
          />
          {type === 'mic_condenser' && (
            <path
              d={`M ${cx - minDim * 0.18} ${cy + minDim * 0.42} Q ${cx} ${cy + minDim * 0.55} ${cx + minDim * 0.18} ${cy + minDim * 0.42}`}
              fill="none"
              stroke={accent}
              strokeWidth={1.2}
            />
          )}
        </g>
      );
    }

    case 'wedge_monitor':
    case 'drum_fill':
    case 'pa_speaker': {
      const isPA = type === 'pa_speaker';
      return (
        <g>
          <polygon
            points={`4,4 ${width - 4},4 ${width - 8},${height - 4} 8,${height - 4}`}
            fill={bodyFill}
            stroke={accent}
            strokeWidth={1.75}
          />
          {/* Speaker cone direction indicator (pointing toward y=height edge or y=0 edge) */}
          <line x1={10} y1={height * 0.35} x2={width - 10} y2={height * 0.35} stroke={accent} strokeWidth={1.4} />
          <polygon
            points={`${cx - 5},${height * 0.72} ${cx + 5},${height * 0.72} ${cx},${height * 0.5}`}
            fill={accent}
          />
          {isPA && (
            <circle cx={cx} cy={cy} r={minDim * 0.16} fill="none" stroke={strokeColor} strokeWidth={1} />
          )}
        </g>
      );
    }

    case 'brass_player':
    case 'woodwind_player':
    case 'string_player':
    case 'upright_bass': {
      const r = minDim * 0.28;
      return (
        <g>
          {/* Chair / Performer circle */}
          <circle cx={cx} cy={cy} r={r} fill={bodyFill} stroke={accent} strokeWidth={1.6} />
          {/* Stand arc in front */}
          <path
            d={`M ${cx - r * 1.1} ${cy + r * 1.15} L ${cx + r * 1.1} ${cy + r * 1.15}`}
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <text
            x={cx}
            y={cy + 3}
            textAnchor="middle"
            fontSize={Math.max(8, r * 0.75)}
            fontWeight="700"
            fill={accent}
            fontFamily="JetBrains Mono, monospace"
          >
            {type === 'brass_player'
              ? 'BR'
              : type === 'woodwind_player'
                ? 'WW'
                : type === 'upright_bass'
                  ? 'DB'
                  : 'STR'}
          </text>
        </g>
      );
    }

    case 'music_stand': {
      return (
        <g>
          <rect x={4} y={height * 0.2} width={width - 8} height={height * 0.35} rx={1.5} fill={bodyFill} stroke={strokeColor} strokeWidth={1.4} />
          <line x1={cx} y1={height * 0.55} x2={cx} y2={height * 0.85} stroke={strokeColor} strokeWidth={1.5} />
          <circle cx={cx} cy={height * 0.85} r={3} fill={accent} />
        </g>
      );
    }

    case 'conductor_podium': {
      return (
        <g>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={4} fill={bodyFillAlt} stroke={accent} strokeWidth={1.75} />
          <rect x={width * 0.2} y={height * 0.14} width={width * 0.6} height={height * 0.22} rx={2} fill={bodyFill} stroke={strokeColor} strokeWidth={1.3} />
          <circle cx={cx} cy={height * 0.64} r={minDim * 0.16} fill={accent} fillOpacity={0.2} stroke={accent} strokeWidth={1.5} />
        </g>
      );
    }

    case 'marimba':
    case 'percussion_table': {
      const isMarimba = type === 'marimba';
      return (
        <g>
          <polygon
            points={
              isMarimba
                ? `3,4 ${width - 3},10 ${width - 3},${height - 10} 3,${height - 4}`
                : `3,3 ${width - 3},3 ${width - 3},${height - 3} 3,${height - 3}`
            }
            fill={bodyFill}
            stroke={accent}
            strokeWidth={1.6}
          />
          {isMarimba &&
            [0.18, 0.32, 0.46, 0.6, 0.74, 0.88].map((p, idx) => (
              <line
                key={idx}
                x1={width * p}
                y1={8}
                x2={width * p}
                y2={height - 8}
                stroke={mutedStroke}
                strokeWidth={1.2}
              />
            ))}
        </g>
      );
    }

    case 'timpani': {
      const kR = minDim * 0.24;
      return (
        <g>
          {[0.18, 0.39, 0.61, 0.82].map((p, i) => (
            <circle
              key={i}
              cx={width * p}
              cy={cy + (i === 1 || i === 2 ? -4 : 4)}
              r={kR * (1 - i * 0.06)}
              fill={woodFill}
              stroke={accent}
              strokeWidth={1.6}
            />
          ))}
        </g>
      );
    }

    case 'stage_box':
    case 'x32_snake':
    case 'iem_rack':
    case 'di_box': {
      const lbl =
        type === 'x32_snake'
          ? 'X32 S16'
          : type === 'stage_box'
            ? 'SNAKE'
            : type === 'iem_rack'
              ? 'IEM'
              : 'DI';
      return (
        <g>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill={bodyFill} stroke={accent} strokeWidth={1.6} />
          {type === 'x32_snake' && (
            <>
              <circle cx={9} cy={9} r={2} fill={accent} />
              <circle cx={width - 9} cy={9} r={2} fill={accent} />
              <line x1={6} y1={height - 7} x2={width - 6} y2={height - 7} stroke={mutedStroke} strokeWidth={1} strokeDasharray="3 2" />
            </>
          )}
          <text
            x={cx}
            y={cy + 3.5}
            textAnchor="middle"
            fontSize={Math.max(8, Math.min(11, minDim * 0.34))}
            fontWeight="700"
            fill={accent}
            fontFamily="JetBrains Mono, monospace"
          >
            {lbl}
          </text>
        </g>
      );
    }

    case 'x32_desk': {
      const faderPositions = [0.14, 0.21, 0.28, 0.35, 0.42, 0.58, 0.65, 0.72, 0.79, 0.86];
      return (
        <g>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={4} fill={bodyFill} stroke={accent} strokeWidth={1.75} />
          {/* Top Channel Strip / EQ Encoders */}
          <rect x={8} y={6} width={width * 0.42} height={height * 0.22} rx={2} fill={bodyFillAlt} stroke={mutedStroke} strokeWidth={0.8} />
          {/* Center X32 TFT Screen */}
          <rect x={width * 0.53} y={6} width={width * 0.22} height={height * 0.25} rx={2} fill="#0F172A" stroke="#38BDF8" strokeWidth={1.1} />
          {/* Right Bus / Meter Bridge */}
          <rect x={width * 0.78} y={6} width={width * 0.14} height={height * 0.22} rx={2} fill={bodyFillAlt} stroke={mutedStroke} strokeWidth={0.8} />
          {/* Motorized Fader Banks */}
          {faderPositions.map((p, idx) => (
            <g key={idx}>
              <line x1={width * p} y1={height * 0.4} x2={width * p} y2={height * 0.86} stroke={mutedStroke} strokeWidth={1.4} />
              <rect
                x={width * p - 2.5}
                y={height * (idx % 2 === 0 ? 0.56 : 0.68)}
                width={5}
                height={5}
                rx={1}
                fill={idx >= 5 ? accent : strokeColor}
              />
            </g>
          ))}
          <text
            x={cx}
            y={height * 0.35}
            textAnchor="middle"
            fontSize={7.5}
            fontWeight="700"
            fill={accent}
            fontFamily="JetBrains Mono, monospace"
          >
            X32
          </text>
        </g>
      );
    }

    case 'tv_panel_80': {
      return (
        <g>
          {/* Rolling stand base / legs */}
          <line x1={width * 0.2} y1={height * 0.15} x2={width * 0.2} y2={height * 0.85} stroke={mutedStroke} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={width * 0.8} y1={height * 0.15} x2={width * 0.8} y2={height * 0.85} stroke={mutedStroke} strokeWidth={2.5} strokeLinecap="round" />
          {/* Thin flat 80" LED screen bezel */}
          <rect
            x={3}
            y={height * 0.34}
            width={width - 6}
            height={Math.max(8, height * 0.32)}
            rx={2}
            fill="#0F172A"
            stroke="#38BDF8"
            strokeWidth={1.6}
          />
          <text
            x={cx}
            y={cy + 3}
            textAnchor="middle"
            fontSize={Math.max(7.5, Math.min(10, height * 0.26))}
            fontWeight="600"
            fill="#E2E8F0"
            fontFamily="JetBrains Mono, monospace"
          >
            80&quot; TV
          </text>
        </g>
      );
    }

    case 'black_backdrop': {
      const waveCount = Math.max(6, Math.floor(width / 18));
      const step = (width - 8) / waveCount;
      let pathD = `M 4 ${cy}`;
      for (let i = 0; i < waveCount; i++) {
        const x1 = 4 + i * step + step * 0.5;
        const x2 = 4 + (i + 1) * step;
        const yOff = i % 2 === 0 ? -Math.min(7, height * 0.28) : Math.min(7, height * 0.28);
        pathD += ` Q ${x1} ${cy + yOff} ${x2} ${cy}`;
      }
      return (
        <g>
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            rx={3}
            fill="#090D16"
            stroke={isDark ? '#64748B' : '#0F172A'}
            strokeWidth={1.5}
          />
          <path d={pathD} fill="none" stroke="#475569" strokeWidth={1.5} />
          <text
            x={cx}
            y={height - 4}
            textAnchor="middle"
            fontSize={8}
            fontWeight="600"
            letterSpacing="0.14em"
            fill="#94A3B8"
            fontFamily="JetBrains Mono, monospace"
          >
            BLACK LAKELAND BACKDROP
          </text>
        </g>
      );
    }

    case 'lectern': {
      return (
        <g>
          {/* Base plate */}
          <rect x={4} y={4} width={width - 8} height={height - 8} rx={3} fill={bodyFillAlt} stroke={strokeColor} strokeWidth={1.4} />
          {/* Angled top desk */}
          <polygon
            points={`8,8 ${width - 8},8 ${width - 12},${height - 10} 12,${height - 10}`}
            fill={woodFill}
            stroke={accent}
            strokeWidth={1.6}
          />
          {/* Gooseneck mic */}
          <circle cx={cx} cy={height * 0.72} r={3.5} fill={accent} />
          <line x1={cx} y1={height * 0.72} x2={cx} y2={height * 0.48} stroke={strokeColor} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      );
    }

    case 'power_drop': {
      return (
        <g>
          <rect x={2} y={2} width={width - 4} height={height - 4} rx={3} fill="#FEF3C7" stroke="#D97706" strokeWidth={1.6} />
          <path
            d={`M ${cx + 2} ${cy - 8} L ${cx - 5} ${cy + 1} L ${cx} ${cy + 1} L ${cx - 2} ${cy + 8} L ${cx + 5} ${cy - 1} L ${cx} ${cy - 1} Z`}
            fill="#B45309"
          />
        </g>
      );
    }

    case 'chair_stool':
    default: {
      return (
        <g>
          <rect x={4} y={4} width={width - 8} height={height - 8} rx={4} fill={bodyFill} stroke={strokeColor} strokeWidth={1.4} />
          <line x1={6} y1={6} x2={width - 6} y2={6} stroke={strokeColor} strokeWidth={2.5} />
        </g>
      );
    }
  }
};
