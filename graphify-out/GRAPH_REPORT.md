# Graph Report - .  (2026-08-05)

## Corpus Check
- Corpus is ~36,487 words - fits in a single context window. You may not need a graph.

## Summary
- 684 nodes · 946 edges · 88 communities (36 shown, 52 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Content Pack Brief Editor
- Sheet & Input Primitives
- Build Tooling & ESLint Config
- Ink Film Canvas Worker
- Brand Context & Image Generation
- TS & Vite Config
- React & Carousel
- Popover / Checkbox / Progress
- Button, Calendar & Pagination
- shadcn Components Registry
- Error Capture Utilities
- Site Design Spec (README)
- Command Palette
- Menubar
- Form Primitives
- NPM Dependencies
- Context Menu
- Dropdown Menu
- Alert Dialog
- Table
- Breadcrumb
- Drawer
- Navigation Menu
- Select
- Card
- Alert
- Input OTP
- Accordion
- Avatar
- Badge
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 83
- Community 84

## God Nodes (most connected - your core abstractions)
1. `cn()` - 69 edges
2. `compilerOptions` - 22 edges
3. `InkEngine` - 15 edges
4. `InkFilm()` - 10 edges
5. `Ink Bloom` - 10 edges
6. `usePackContext()` - 9 edges
7. `react` - 8 edges
8. `scripts` - 7 edges
9. `RGB` - 7 edges
10. `Brief` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Offhours Favicon (Power+Clock Glyph)` --conceptually_related_to--> `Palette Spec (Ground/Ink/Accents)`  [INFERRED]
  public/favicon.svg → README.md
- `CalendarDayButton()` --references--> `react`  [EXTRACTED]
  src/components/ui/calendar.tsx → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Eight Full-Viewport Sections Over One Background** — readme_section_01_cover, readme_section_02_argument, readme_section_03_difference, readme_section_04_offer, readme_section_05_position, readme_section_06_index, readme_section_07_spec, readme_section_08_close [EXTRACTED 1.00]
- **Scroll-Driven Visual Effects System** — readme_generative_ink_film, readme_section_anchored_hue_ramp, readme_scroll_wiped_before_after, readme_scroll_velocity_skew, readme_cursor_dye_bloom [INFERRED 0.85]

## Communities (88 total, 52 thin omitted)

### Community 0 - "Content Pack Brief Editor"
Cohesion: 0.05
Nodes (60): BriefPanel(), EMPTY_BRIEF, GOALS, PLATFORMS, A, ContentPack(), LETTERS, PROMO_FEATURES (+52 more)

### Community 1 - "Sheet & Input Primitives"
Cohesion: 0.05
Nodes (39): Input, Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay (+31 more)

### Community 2 - "Build Tooling & ESLint Config"
Cohesion: 0.04
Nodes (44): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, nitro (+36 more)

### Community 3 - "Ink Film Canvas Worker"
Cohesion: 0.10
Nodes (25): InkFilm(), supportsOffscreen(), BudgetMsg, HiddenMsg, InitMsg, loop(), Msg, RampMsg (+17 more)

### Community 4 - "Brand Context & Image Generation"
Cohesion: 0.07
Nodes (27): Brand, BrandContext, BrandContextValue, BrandProvider(), EMPTY_BRAND, buildPrompt(), Input, pickScenes() (+19 more)

### Community 5 - "TS & Vite Config"
Cohesion: 0.06
Nodes (31): DOM, DOM.Iterable, ES2022, eslint.config.js, src/**/*.ts, src/**/*.tsx, vite/client, vite.config.ts (+23 more)

### Community 6 - "React & Carousel"
Cohesion: 0.07
Nodes (25): react, react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem (+17 more)

### Community 7 - "Popover / Checkbox / Progress"
Cohesion: 0.10
Nodes (12): Checkbox, HoverCardContent, PopoverContent, Progress, Slider, Switch, Textarea, ToggleGroup (+4 more)

### Community 8 - "Button, Calendar & Pagination"
Cohesion: 0.19
Nodes (16): Button, ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), Pagination(), PaginationContent, PaginationEllipsis() (+8 more)

### Community 9 - "shadcn Components Registry"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 10 - "Error Capture Utilities"
Cohesion: 0.17
Nodes (13): consumeLastCapturedError(), describeError(), describeStatus(), originalConsoleError, safeStringify(), renderErrorPage(), fetch(), getServerEntry() (+5 more)

### Community 11 - "Site Design Spec (README)"
Cohesion: 0.12
Nodes (17): Offhours Favicon (Power+Clock Glyph), Cursor Dye Bloom, Generative Ink Film (Signature Background), Ink Bloom, Palette Spec (Ground/Ink/Accents), Scroll-Velocity Skew, Scroll-Wiped Before and After, Section 01 Cover (+9 more)

### Community 12 - "Command Palette"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

### Community 13 - "Menubar"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 14 - "Form Primitives"
Cohesion: 0.15
Nodes (11): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+3 more)

### Community 15 - "NPM Dependencies"
Cohesion: 0.15
Nodes (13): class-variance-authority, @hookform/resolvers, dependencies, class-variance-authority, @hookform/resolvers, @radix-ui/react-aspect-ratio, @radix-ui/react-label, @radix-ui/react-tabs (+5 more)

### Community 16 - "Context Menu"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 17 - "Dropdown Menu"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 18 - "Alert Dialog"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 19 - "Table"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 20 - "Breadcrumb"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 21 - "Drawer"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 22 - "Navigation Menu"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 23 - "Select"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 24 - "Card"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 25 - "Alert"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 26 - "Input OTP"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 27 - "Accordion"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 28 - "Avatar"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 29 - "Badge"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 30 - "Community 30"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (3): TanStack Start File-Based Routing Conventions, __root.tsx App Shell, routeTree.gen.ts (Auto-Generated)

## Knowledge Gaps
- **349 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+344 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **52 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `NPM Dependencies` to `Build Tooling & ESLint Config`, `React & Carousel`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 66`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 80`, `Community 81`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **Why does `cn()` connect `Button, Calendar & Pagination` to `Sheet & Input Primitives`, `React & Carousel`, `Popover / Checkbox / Progress`, `Command Palette`, `Menubar`, `Form Primitives`, `Context Menu`, `Dropdown Menu`, `Alert Dialog`, `Table`, `Breadcrumb`, `Drawer`, `Navigation Menu`, `Select`, `Card`, `Alert`, `Input OTP`, `Accordion`, `Avatar`, `Badge`, `Community 30`, `Community 31`, `Community 32`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `react` connect `React & Carousel` to `Button, Calendar & Pagination`, `Sheet & Input Primitives`, `NPM Dependencies`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _349 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Content Pack Brief Editor` be split into smaller, more focused modules?**
  _Cohesion score 0.05379746835443038 - nodes in this community are weakly interconnected._
- **Should `Sheet & Input Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.05217391304347826 - nodes in this community are weakly interconnected._
- **Should `Build Tooling & ESLint Config` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._