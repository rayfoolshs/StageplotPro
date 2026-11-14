export type EquipmentCategory =
  | 'vocals'
  | 'drums'
  | 'guitars'
  | 'keys'
  | 'winds_strings'
  | 'monitoring'
  | 'staging';

export type EquipmentShape =
  | 'mic_boom'
  | 'mic_wireless'
  | 'mic_condenser'
  | 'drum_kit'
  | 'drum_compact'
  | 'percussion_table'
  | 'timpani'
  | 'marimba'
  | 'guitar_amp'
  | 'bass_amp'
  | 'acoustic_guitar'
  | 'pedalboard'
  | 'grand_piano'
  | 'upright_piano'
  | 'keyboard_single'
  | 'keyboard_double'
  | 'brass_player'
  | 'woodwind_player'
  | 'string_player'
  | 'upright_bass'
  | 'music_stand'
  | 'conductor_podium'
  | 'wedge_monitor'
  | 'drum_fill'
  | 'iem_rack'
  | 'di_box'
  | 'stage_box'
  | 'x32_snake'
  | 'x32_desk'
  | 'power_drop'
  | 'riser'
  | 'choir_riser'
  | 'chair_stool'
  | 'pa_speaker'
  | 'tv_panel_80'
  | 'black_backdrop'
  | 'lectern';

export interface SuggestedChannel {
  source: string;
  micOrDi: string;
  stand: string;
  phantom48v: boolean;
}

export interface EquipmentDefinition {
  type: EquipmentShape;
  name: string;
  shortLabel: string;
  category: EquipmentCategory;
  /** Default width in meters */
  defaultWidthM: number;
  /** Default depth in meters */
  defaultDepthM: number;
  resizable?: boolean;
  rotatable?: boolean;
  isZone?: boolean;
  suggestedChannels?: SuggestedChannel[];
  defaultNotes?: string;
}

export interface StageItem {
  id: string;
  type: EquipmentShape;
  label: string;
  performer?: string;
  /** Center X position in meters from Stage Left edge (0 to stageWidthM) */
  xM: number;
  /** Center Y position in meters from Upstage edge (0 to stageDepthM) */
  yM: number;
  /** Width in meters */
  widthM: number;
  /** Depth in meters */
  depthM: number;
  /** Rotation in degrees (0 = facing audience / downstage) */
  rotation: number;
  /** Optional channel badge(s) e.g. "1" or "1-4" */
  channelLabel?: string;
  /** Optional monitor mix ID e.g. "Mix 1" */
  monitorMixId?: string;
  /** Optional cable link to a stage box ID */
  connectedToId?: string;
  locked?: boolean;
  zIndex: number;
  notes?: string;
  /** Custom tint override */
  color?: string;
}

export interface InputChannel {
  id: string;
  channelNumber: number;
  source: string;
  micOrDi: string;
  stand: string;
  phantom48v: boolean;
  stageItemId?: string;
  notes: string;
}

export interface MonitorMix {
  id: string;
  name: string;
  type: 'Floor Wedge' | 'IEM Stereo' | 'IEM Mono' | 'Drum Fill' | 'Side Fill';
  performerOrPosition: string;
  requestedContents: string;
}

export interface StageConfig {
  widthM: number;
  depthM: number;
  unit: 'm' | 'ft';
  gridStepM: number;
  hasApron: boolean;
  showGrid: boolean;
  showLabels: boolean;
  showChannels: boolean;
  showCables: boolean;
  showDimensions: boolean;
  stageSurface: 'dark' | 'light' | 'blueprint';
}

export interface StageProject {
  id: string;
  title: string;
  ensembleOrArtist: string;
  eventOrVenue: string;
  eventDate: string;
  contactName: string;
  contactEmail: string;
  stageNotes: string;
  powerNotes: string;
  stageConfig: StageConfig;
  items: StageItem[];
  inputList: InputChannel[];
  monitorMixes: MonitorMix[];
  updatedAt: string;
}

export type WorkspaceTab = 'plot' | 'patch' | 'rider';
