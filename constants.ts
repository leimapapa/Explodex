
import { ClassInfo } from "./types";

// Standard ImageNet normalization constants (Defaults)
export const IMAGENET_MEAN = [0.485, 0.456, 0.406];
export const IMAGENET_STD = [0.229, 0.224, 0.225];

// Default dimensions
export const TARGET_WIDTH = 224;
export const TARGET_HEIGHT = 224;

// Custom App Logo SVG
export const APP_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 181" fill="none">
<defs>
<filter id="filter0_d_452_156" x="0" y="0" width="79.231" height="180.559" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_452_156"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_452_156" result="shape"/>
</filter>
</defs>
<g filter="url(#filter0_d_452_156)">
<path d="M55.6158 64.9464L69.231 72.6752V134.935L39.2309 164.133L10 134.935V71.3871L69.231 40.9012V12.1328L39.2309 34.4605L10 12.1328V40.9012L22.1541 49.4887" stroke="white" stroke-width="12" stroke-linecap="round"/>
<path d="M30.8035 76.1103L30.707 87.3069L9.63066 98.0152L5.86596 88.7805L30.8035 76.1103Z" fill="white" stroke="white"/>
<path d="M31.7225 97.1008L31.5511 108.335L10.554 119.004L6.7893 109.769L31.7225 97.1008Z" fill="white" stroke="white"/>
</g>
</svg>`;
export const APP_LOGO_SVG_SQUARE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 181 181" fill="none">
<defs>
<filter id="filter0_d_452_156" x="0" y="0" width="79.231" height="180.559" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_452_156"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_452_156" result="shape"/>
</filter>
</defs>
<g filter="url(#filter0_d_452_156)" transform="translate(50 0)">
<path d="M55.6158 64.9464L69.231 72.6752V134.935L39.2309 164.133L10 134.935V71.3871L69.231 40.9012V12.1328L39.2309 34.4605L10 12.1328V40.9012L22.1541 49.4887" stroke="white" stroke-width="12" stroke-linecap="round"/>
<path d="M30.8035 76.1103L30.707 87.3069L9.63066 98.0152L5.86596 88.7805L30.8035 76.1103Z" fill="white" stroke="white"/>
<path d="M31.7225 97.1008L31.5511 108.335L10.554 119.004L6.7893 109.769L31.7225 97.1008Z" fill="white" stroke="white"/>
</g>
</svg>`;

// Built-in descriptions for specific classes (UXO Context)
export const BUILT_IN_CLASS_DESCRIPTIONS: Record<string, ClassInfo> = {
  "Bomb": {
    title: "Bomb",
    description: "An explosive weapon that uses the exothermic reaction of an explosive material to provide an extremely sudden and violent release of energy. Typically dropped from aircraft.",
    tags: ["Explosive", "Aerial", "Heavy"],
    details: { "Hazard": "High Blast / Fragmentation", "Deployment": "Aircraft" }
  },
  "Dispenser": {
    title: "Dispenser",
    description: "An aircraft-mounted or dropped container designed to carry and release multiple submunitions over a target area.",
    tags: ["Container", "Aerial"],
    details: { "Content": "Submunitions", "Hazard": "Area Denial" }
  },
  "Fuze": {
    title: "Fuze",
    description: "A mechanical or electronic device that detonates a munition's explosive material under specified conditions, such as impact, time, or proximity.",
    tags: ["Component", "Trigger"],
    details: { "Type": "Mechanical/Electrical", "Sensitivity": "High" }
  },
  "Grenade": {
    title: "Grenade",
    description: "A small explosive, chemical, or gas bomb. It is typically thrown by hand (hand grenade) or launched from a specialized launcher.",
    tags: ["Infantry", "Short Range"],
    details: { "Initiation": "Pin/Lever", "Kill Radius": "5-15 meters" }
  },
  "Guided Missile": {
    title: "Guided Missile",
    description: "A self-propelled projectile with a guidance system allowing it to steer towards a target after launch.",
    tags: ["Propelled", "Smart Weapon"],
    details: { "Propulsion": "Rocket/Jet", "Guidance": "Radar/IR/Laser" }
  },
  "IED": {
    title: "Improvised Explosive Device",
    description: "A bomb constructed and deployed in ways other than in conventional military action. They may be constructed of conventional military explosives, such as an artillery shell, attached to a detonating mechanism.",
    tags: ["Asymmetric", "Hazard"],
    details: { "Construction": "Non-standard", "Trigger": "Varied" }
  },
  "Landmine": {
    title: "Landmine",
    description: "An explosive device concealed under or on the ground and designed to destroy or disable enemy targets, ranging from combatants to vehicles and tanks, as they pass over or near it.",
    tags: ["Trap", "Area Denial"],
    details: { "Trigger": "Pressure/Tripwire", "Persistence": "Long-term" }
  },
  "Mortar": {
    title: "Mortar",
    description: "A muzzle-loading indirect fire weapon that fires projectiles at high angles to clear obstacles and drop onto targets.",
    tags: ["Artillery", "Indirect Fire"],
    details: { "Trajectory": "High Arc", "Range": "Short to Medium" }
  },
  "Projectile": {
    title: "Projectile",
    description: "An object propelled by the application of external force, such as a bullet or artillery shell, that continues in motion by its own inertia.",
    tags: ["Kinetic", "Ballistic"],
    details: { "Propulsion": "Gun/Cannon", "Type": "Solid/Explosive" }
  },
  "Rocket": {
    title: "Rocket",
    description: "A projectile that can be propelled to a great speed and distance by the combustion of its contents, usually without an active guidance system.",
    tags: ["Propelled", "Ballistic"],
    details: { "Guidance": "None (usually)", "Propulsion": "Solid Fuel" }
  },
  "Submunition": {
    title: "Submunition",
    description: "A small munition, such as a bomblet or grenade, separated from a larger parent munition (dispenser) to cover a wider area.",
    tags: ["Cluster", "Small"],
    details: { "Parent": "Cluster Bomb", "Hazard": "High Dud Rate" }
  }
};

// Sample JSON structure
export const SAMPLE_JSON = `{
  "classes": [
    "Bomb",
    "Dispenser",
    "Fuze",
    "Grenade",
    "Guided Missile",
    "IED",
    "Landmine",
    "Mortar",
    "Projectile",
    "Rocket",
    "Submunition"
  ],
  "num_classes": 11,
  "img_size": 224,
  "input_mean": [0.485, 0.456, 0.406],
  "input_std": [0.229, 0.224, 0.225],
  "best_val_accuracy": 97.5931497338579,
  "model_name": "mobilenet_classifier"
}`;
