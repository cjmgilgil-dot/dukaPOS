import {
  Zap, Battery, PlugZap, Plug, Cable, CircuitBoard, Microchip, Cpu,
  Lightbulb, Sun, Flame, Flashlight,
  Monitor, Tv2, Laptop, Smartphone, Phone, Headphones, Camera,
  Wifi, Bluetooth, Server, Database, HardDrive, Printer, Radio, Gamepad2,
  Droplets, Waves, Thermometer, Snowflake, Wind, Fan,
  Wrench, Hammer, Drill, Scissors, Ruler, Cog, Settings, Bolt, Construction, HardHat,
  Paintbrush, Brush, Palette, PaintBucket,
  Package, Package2, Box, Boxes, Archive, Warehouse,
  ShoppingCart, ShoppingBag, Store, Tag, Layers, Globe,
  Home, Building2, Shield, Lock, Key,
  Leaf, Car, Truck, Sofa, Bed, Bath, FlaskConical,
  type LucideIcon,
} from "lucide-react"

export interface IconEntry {
  name: string
  label: string
  icon: LucideIcon
  group: string
}

export const CATEGORY_ICONS: IconEntry[] = [
  // Electrical & Power
  { name: "Zap",           label: "Electricity",   icon: Zap,          group: "Electrical" },
  { name: "Battery",       label: "Battery",        icon: Battery,      group: "Electrical" },
  { name: "PlugZap",       label: "Power Plug",     icon: PlugZap,      group: "Electrical" },
  { name: "Plug",          label: "Plug",           icon: Plug,         group: "Electrical" },
  { name: "Cable",         label: "Cable/Wire",     icon: Cable,        group: "Electrical" },
  { name: "CircuitBoard",  label: "Circuit Board",  icon: CircuitBoard, group: "Electrical" },
  { name: "Microchip",     label: "Microchip",      icon: Microchip,    group: "Electrical" },
  { name: "Cpu",           label: "CPU",            icon: Cpu,          group: "Electrical" },

  // Lighting
  { name: "Lightbulb",    label: "Bulb",           icon: Lightbulb,    group: "Lighting"   },
  { name: "Sun",          label: "Solar/Sun",       icon: Sun,          group: "Lighting"   },
  { name: "Flame",        label: "Flame",           icon: Flame,        group: "Lighting"   },
  { name: "Flashlight",   label: "Flashlight",      icon: Flashlight,   group: "Lighting"   },

  // Electronics & Tech
  { name: "Monitor",      label: "Monitor/TV",      icon: Monitor,      group: "Electronics" },
  { name: "Tv2",          label: "Television",      icon: Tv2,          group: "Electronics" },
  { name: "Laptop",       label: "Laptop",          icon: Laptop,       group: "Electronics" },
  { name: "Smartphone",   label: "Smartphone",      icon: Smartphone,   group: "Electronics" },
  { name: "Phone",        label: "Phone",           icon: Phone,        group: "Electronics" },
  { name: "Headphones",   label: "Headphones",      icon: Headphones,   group: "Electronics" },
  { name: "Camera",       label: "Camera",          icon: Camera,       group: "Electronics" },
  { name: "Wifi",         label: "Wi-Fi",           icon: Wifi,         group: "Electronics" },
  { name: "Bluetooth",    label: "Bluetooth",       icon: Bluetooth,    group: "Electronics" },
  { name: "Server",       label: "Server",          icon: Server,       group: "Electronics" },
  { name: "Database",     label: "Database",        icon: Database,     group: "Electronics" },
  { name: "HardDrive",    label: "Hard Drive",      icon: HardDrive,    group: "Electronics" },
  { name: "Printer",      label: "Printer",         icon: Printer,      group: "Electronics" },
  { name: "Radio",        label: "Radio",           icon: Radio,        group: "Electronics" },
  { name: "Gamepad2",     label: "Gaming",          icon: Gamepad2,     group: "Electronics" },

  // Plumbing & Water
  { name: "Droplets",     label: "Water/Plumbing",  icon: Droplets,     group: "Plumbing"   },
  { name: "Waves",        label: "Waves/Liquid",    icon: Waves,        group: "Plumbing"   },
  { name: "Thermometer",  label: "Thermometer",     icon: Thermometer,  group: "Plumbing"   },

  // Climate & Air
  { name: "Snowflake",    label: "Air-Con/Cooling", icon: Snowflake,    group: "Climate"    },
  { name: "Wind",         label: "Ventilation",     icon: Wind,         group: "Climate"    },
  { name: "Fan",          label: "Fan",             icon: Fan,          group: "Climate"    },

  // Tools & Hardware
  { name: "Wrench",       label: "Wrench/Spanner",  icon: Wrench,       group: "Tools"      },
  { name: "Hammer",       label: "Hammer",          icon: Hammer,       group: "Tools"      },
  { name: "Drill",        label: "Drill",           icon: Drill,        group: "Tools"      },
  { name: "Scissors",     label: "Scissors",        icon: Scissors,     group: "Tools"      },
  { name: "Ruler",        label: "Ruler/Measure",   icon: Ruler,        group: "Tools"      },
  { name: "Cog",          label: "Cog/Gear",        icon: Cog,          group: "Tools"      },
  { name: "Settings",     label: "Settings/Parts",  icon: Settings,     group: "Tools"      },
  { name: "Bolt",         label: "Bolt/Fastener",   icon: Bolt,         group: "Tools"      },
  { name: "Construction", label: "Construction",    icon: Construction, group: "Tools"      },
  { name: "HardHat",      label: "Safety/PPE",      icon: HardHat,      group: "Tools"      },

  // Paint & Decor
  { name: "Paintbrush",   label: "Paintbrush",      icon: Paintbrush,   group: "Paint"      },
  { name: "Brush",        label: "Brush",           icon: Brush,        group: "Paint"      },
  { name: "Palette",      label: "Colours",         icon: Palette,      group: "Paint"      },
  { name: "PaintBucket",  label: "Paint Tin",       icon: PaintBucket,  group: "Paint"      },

  // Storage & Packaging
  { name: "Package",      label: "Package",         icon: Package,      group: "Storage"    },
  { name: "Package2",     label: "Parcel",          icon: Package2,     group: "Storage"    },
  { name: "Box",          label: "Box",             icon: Box,          group: "Storage"    },
  { name: "Boxes",        label: "Boxes",           icon: Boxes,        group: "Storage"    },
  { name: "Archive",      label: "Archive",         icon: Archive,      group: "Storage"    },
  { name: "Warehouse",    label: "Warehouse",       icon: Warehouse,    group: "Storage"    },

  // Retail & General
  { name: "ShoppingCart", label: "Cart",            icon: ShoppingCart, group: "Retail"     },
  { name: "ShoppingBag",  label: "Shopping Bag",    icon: ShoppingBag,  group: "Retail"     },
  { name: "Store",        label: "Shop/Store",      icon: Store,        group: "Retail"     },
  { name: "Tag",          label: "Tag/Label",       icon: Tag,          group: "Retail"     },
  { name: "Layers",       label: "Categories",      icon: Layers,       group: "Retail"     },
  { name: "Globe",        label: "Imports/Global",  icon: Globe,        group: "Retail"     },

  // Building & Safety
  { name: "Home",         label: "Home/Property",   icon: Home,         group: "Building"   },
  { name: "Building2",    label: "Building/Office", icon: Building2,    group: "Building"   },
  { name: "Shield",       label: "Security",        icon: Shield,       group: "Building"   },
  { name: "Lock",         label: "Locks",           icon: Lock,         group: "Building"   },
  { name: "Key",          label: "Keys",            icon: Key,          group: "Building"   },

  // Misc
  { name: "Leaf",         label: "Garden/Eco",      icon: Leaf,         group: "Other"      },
  { name: "Car",          label: "Automotive",      icon: Car,          group: "Other"      },
  { name: "Truck",        label: "Delivery/Truck",  icon: Truck,        group: "Other"      },
  { name: "Sofa",         label: "Furniture",       icon: Sofa,         group: "Other"      },
  { name: "Bed",          label: "Bedroom",         icon: Bed,          group: "Other"      },
  { name: "Bath",         label: "Bathroom",        icon: Bath,         group: "Other"      },
  { name: "FlaskConical", label: "Chemicals/Lab",   icon: FlaskConical, group: "Other"      },
]

// Map icon name → LucideIcon component for fast lookup
export const ICON_MAP = new Map<string, LucideIcon>(
  CATEGORY_ICONS.map((e) => [e.name, e.icon])
)

export const ICON_GROUPS = [...new Set(CATEGORY_ICONS.map((e) => e.group))]
