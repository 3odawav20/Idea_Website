import { Lightbulb, Palette, RotateCcw, Sparkles, SlidersHorizontal } from "lucide-react";
import "./Room3DLighting.css";

export type RoomMode = "empty" | "kitchen" | "bathroom" | "living";
export type TileFinish = "matte" | "satin" | "polished";
export type LightPreset = "daylight" | "neutral" | "warm" | "sunset" | "blue" | "purple" | "custom";
export type RoomLightSettings = {
  preset: LightPreset;
  color: string;
  power: number;
  ambient: number;
  daylightPower: number;
  exposure: number;
  x: number;
  z: number;
  height: number;
  shadows: boolean;
  enabled: boolean;
  finish: TileFinish;
};
export const NATURAL_LIGHT: RoomLightSettings = {
  preset: "daylight",
  color: "#fff1df",
  power: .74,
  ambient: .58,
  daylightPower: .78,
  exposure: .83,
  x: .28,
  z: -.10,
  height: .93,
  shadows: true,
  enabled: true,
  finish: "satin",
};

const swatches: { key: Exclude<LightPreset,"custom">; color:string }[] = [
  { key:"daylight",color:"#fff1df" },
  { key:"neutral",color:"#ffffff" },
  { key:"warm",color:"#ffc48b" },
  { key:"sunset",color:"#ff926d" },
  { key:"blue",color:"#70baff" },
  { key:"purple",color:"#cf91ff" },
];
const texts = {
  en: {mode: "Scene", empty: "Empty room", kitchen: "Kitchen preview", bathroom: "Bathroom preview", living: "Living room preview", panel: "Lighting & material realism", subtitle: "Live color, shadows and ceramic reflections", presets: "Lighting mood", daylight: "Daylight", neutral: "Neutral", warm: "Warm", sunset: "Sunset", blue: "Blue", purple: "Purple", custom: "Custom", power: "Lamp brightness", ambient: "Soft ambient light", daylightPower: "Window / sun light", exposure: "Camera exposure", color: "Lamp color", position: "Light position", horizontal: "Left / right", depth: "Front / back", height: "Lamp height", finish: "Ceramic / porcelain finish", matte: "Matte", satin: "Satin", polished: "Polished", shadows: "Soft realistic shadows", enable: "Lights on", reset: "Natural light", info: "Material reflections are physically based previews. True product texture maps and exact real-world brightness require calibrated assets."},
  ar: {mode: "\u0646\u0648\u0639 \u0627\u0644\u063a\u0631\u0641\u0629", empty: "\u063a\u0631\u0641\u0629 \u0641\u0627\u0636\u064a\u0629", kitchen: "\u0645\u0637\u0628\u062e \u062a\u062c\u0631\u064a\u0628\u064a", bathroom:"\u062d\u0645\u0627\u0645 \u062c\u0627\u0647\u0632", living:"\u063a\u0631\u0641\u0629 \u0645\u0639\u064a\u0634\u0629", panel: "\u0627\u0644\u0625\u0636\u0627\u0621\u0629 \u0648\u0648\u0627\u0642\u0639\u064a\u0629 \u0627\u0644\u062e\u0627\u0645\u0627\u062a", subtitle: "\u062a\u062d\u0643\u0645 \u0645\u0628\u0627\u0634\u0631 \u0641\u064a \u0627\u0644\u0644\u0648\u0646 \u0648\u0627\u0644\u0638\u0644\u0627\u0644 \u0648\u0627\u0646\u0639\u0643\u0627\u0633 \u0627\u0644\u0633\u064a\u0631\u0627\u0645\u064a\u0643", presets: "\u0644\u0648\u0646 \u0648\u0625\u062d\u0633\u0627\u0633 \u0627\u0644\u0625\u0636\u0627\u0621\u0629", daylight: "\u0636\u0648\u0621 \u0627\u0644\u0646\u0647\u0627\u0631", neutral: "\u0623\u0628\u064a\u0636 \u0637\u0628\u064a\u0639\u064a", warm: "\u062f\u0627\u0641\u0626", sunset: "\u063a\u0631\u0648\u0628", blue: "\u0623\u0632\u0631\u0642", purple: "\u0628\u0646\u0641\u0633\u062c\u064a", custom: "\u0645\u062e\u0635\u0635", power: "\u0642\u0648\u0629 \u0627\u0644\u0625\u0636\u0627\u0621\u0629", ambient: "\u0627\u0644\u0625\u0636\u0627\u0621\u0629 \u0627\u0644\u0645\u062d\u064a\u0637\u0629", daylightPower: "\u0636\u0648\u0621 \u0627\u0644\u0634\u0645\u0633 \u0648\u0627\u0644\u0646\u0627\u0641\u0630\u0629", exposure: "\u062a\u0639\u0631\u064a\u0636 \u0627\u0644\u0643\u0627\u0645\u064a\u0631\u0627", color: "\u0644\u0648\u0646 \u0627\u0644\u0645\u0635\u0628\u0627\u062d", position: "\u0645\u0643\u0627\u0646 \u0627\u0644\u0645\u0635\u0628\u0627\u062d", horizontal: "\u064a\u0645\u064a\u0646 / \u0634\u0645\u0627\u0644", depth: "\u0642\u062f\u0627\u0645 / \u0648\u0631\u0627", height: "\u0627\u0631\u062a\u0641\u0627\u0639 \u0627\u0644\u0625\u0636\u0627\u0621\u0629", finish: "\u062a\u0634\u0637\u064a\u0628 \u0627\u0644\u0633\u064a\u0631\u0627\u0645\u064a\u0643 \u0648\u0627\u0644\u0628\u0648\u0631\u0633\u0644\u064a\u0646", matte: "\u0645\u0637\u0641\u064a", satin: "\u0646\u0635\u0641 \u0644\u0627\u0645\u0639", polished: "\u0644\u0627\u0645\u0639", shadows: "\u0638\u0644\u0627\u0644 \u0648\u0627\u0642\u0639\u064a\u0629 \u0646\u0627\u0639\u0645\u0629", enable: "\u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0625\u0636\u0627\u0621\u0629", reset: "\u0625\u0636\u0627\u0621\u0629 \u0637\u0628\u064a\u0639\u064a\u0629", info: "\u0627\u0644\u0627\u0646\u0639\u0643\u0627\u0633\u0627\u062a \u0647\u0646\u0627 \u0645\u062d\u0627\u0643\u0627\u0629 \u0641\u064a\u0632\u064a\u0627\u0626\u064a\u0629 \u0645\u0631\u0626\u064a\u0629\u061b \u0627\u0644\u062f\u0642\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629 \u0644\u0644\u0645\u0646\u062a\u062c \u062a\u062d\u062a\u0627\u062c \u062e\u0631\u0627\u0626\u0637 \u062e\u0627\u0645\u0627\u062a \u0645\u0639\u0627\u064a\u0631\u0629."},
  fr: {mode: "Type de pi\u00e8ce", empty: "Pi\u00e8ce vide", kitchen: "Cuisine de d\u00e9monstration", bathroom:"Salle de bain", living:"Salon", panel: "\u00c9clairage et mat\u00e9riaux", subtitle: "Couleurs, ombres et reflets en direct", presets: "Ambiance lumineuse", daylight: "Jour", neutral: "Neutre", warm: "Chaud", sunset: "Coucher de soleil", blue: "Bleu", purple: "Violet", custom: "Personnalis\u00e9", power: "Intensit\u00e9 de la lampe", ambient: "Lumi\u00e8re ambiante", daylightPower: "Lumi\u00e8re du jour", exposure: "Exposition", color: "Couleur de la lampe", position: "Position de la lampe", horizontal: "Gauche / droite", depth: "Avant / arri\u00e8re", height: "Hauteur", finish: "Finition du carrelage", matte: "Mat", satin: "Satin", polished: "Brillant", shadows: "Ombres douces", enable: "Lumi\u00e8res activ\u00e9es", reset: "Lumi\u00e8re naturelle", info: "Les reflets sont des simulations physiques; les mat\u00e9riaux r\u00e9els n\u00e9cessitent des cartes calibr\u00e9es."},
} as const;

type TextLocale = "en" | "ar" | "fr";
type Props = {
  locale: TextLocale;
  mode: RoomMode;
  onModeChange: (mode: RoomMode) => void;
  settings: RoomLightSettings;
  onSettingsChange: (next: RoomLightSettings) => void;
};
export function Room3DLighting({locale,mode,onModeChange,settings,onSettingsChange}:Props) {
  const t=texts[locale];
  const patch=(delta:Partial<RoomLightSettings>)=>onSettingsChange({...settings,...delta});
  const slider=(field:"power"|"ambient"|"daylightPower"|"exposure"|"x"|"z"|"height",name:string,min:number,max:number,step:number)=>(
    <label className="idea-lighting-slider" key={field}>
      <span>{name} <b>{Math.round(settings[field]*100)}%</b></span>
      <input aria-label={name} type="range" min={min} max={max} step={step}
        value={settings[field]} onChange={e=>patch({[field]:Number(e.target.value)})} />
    </label>
  );
  return (
    <section className="idea-lighting" aria-label={t.panel}>
      <h2><Sparkles size={16}/>{t.mode}</h2>
      <div className="idea-lighting-segments" role="group" aria-label={t.mode}>
        {(["empty","kitchen","bathroom","living"] as const).map(value=>(
          <button key={value} type="button" className={mode===value?"active":""}
            aria-pressed={mode===value} onClick={()=>onModeChange(value)}>{t[value]}</button>
        ))}
      </div>
      <div className="idea-lighting-heading">
        <h2><Lightbulb size={16}/>{t.panel}</h2><p>{t.subtitle}</p>
      </div>
      <label className="idea-lighting-switch">
        <input type="checkbox" checked={settings.enabled} onChange={e=>patch({enabled:e.target.checked})}/>
        <span>{t.enable}</span>
      </label>
      <div className="idea-lighting-heading">
        <h3><Palette size={14}/>{t.presets}</h3>
      </div>
      <div className="idea-lighting-swatches" role="group" aria-label={t.presets}>
        {swatches.map(s=>(
          <button key={s.key} type="button" className={settings.preset===s.key?"active":""}
            title={t[s.key]} aria-label={t[s.key]} aria-pressed={settings.preset===s.key}
            onClick={()=>patch({color:s.color,preset:s.key})}>
            <span style={{backgroundColor:s.color}}/><small>{t[s.key]}</small>
          </button>
        ))}
      </div>
      <label className="idea-lighting-color">
        <span>{t.color}</span>
        <input type="color" aria-label={t.color} value={settings.color}
          onChange={e=>patch({color:e.target.value,preset:"custom"})} />
        <code>{settings.color.toUpperCase()}</code>
      </label>
      {slider("power",t.power,0,1.5,.025)}
      {slider("ambient",t.ambient,0,1.2,.025)}
      {slider("daylightPower",t.daylightPower,0,1.3,.025)}
      {slider("exposure",t.exposure,.45,1.35,.025)}
      <h3 className="idea-lighting-subheading"><SlidersHorizontal size={14}/>{t.position}</h3>
      {slider("x",t.horizontal,-1,1,.025)}
      {slider("z",t.depth,-1,1,.025)}
      {slider("height",t.height,.4,1,.025)}
      <label className="idea-lighting-switch">
        <input type="checkbox" checked={settings.shadows} onChange={e=>patch({shadows:e.target.checked})}/>
        <span>{t.shadows}</span>
      </label>
      <h3 className="idea-lighting-subheading">{t.finish}</h3>
      <div className="idea-lighting-segments idea-lighting-finishes" role="group" aria-label={t.finish}>
        {(["matte","satin","polished"] as const).map(value=>(
          <button key={value} type="button" aria-pressed={settings.finish===value}
            className={settings.finish===value?"active":""}
            onClick={()=>patch({finish:value})}>{t[value]}</button>
        ))}
      </div>
      <button type="button" className="idea-lighting-reset"
        onClick={()=>onSettingsChange({...NATURAL_LIGHT})}><RotateCcw size={14}/>{t.reset}</button>
      <p className="idea-lighting-footnote">{t.info}</p>
    </section>
  );
}
