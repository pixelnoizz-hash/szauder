/* ==========================================================================
   HELL VISITOR ATLAS — content & configuration
   Edit this file to change hotspots, camera views or media. No rebuild needed.
   Media files live in /media; paths are relative to index.html.
   Positions are in the model's design frame (1 unit ≈ 175 m).
   ========================================================================== */
window.ATLAS_CONFIG = {

  meta: {
    eyebrow: 'Visitor Atlas · Level Overview',
    title: 'Hell',
    subtitle: 'An underground public attraction, mapped for visitors.',
    sourceNote: 'Features and services follow Erlend Loe, <i>Helvete</i>.',
    interpretationNote: 'Arrangement, districts and architecture are the artist’s speculative reading.',
  },

  finalVideo: { label: 'Final video', title: 'Final video', src: 'media/finalvideo.mp4', poster: 'media/finalvideo.poster.jpg' },

  render: { hemi: 0.8, sun: 2.4, sunPos: [24, 112, 78], maxPixelRatio: 2, maxPixels: 8300000 },

  camera: {
    default: { target: [-3, -8.5, -3], az: 24, el: 31, zoom: 0.9 },
    limits: { el: [-84, 88], zoom: [0.35, 26] },
    bounds: { x: [-62, 62], y: [-30, 14], z: [-52, 52] },
    fit: { height: 46, width: 88 },          // world units that must always fit the frame
  },

  /* Predefined presentation views (also the “View” links) */
  views: [
    { id: 'overview', label: 'Overview', target: [-3, -8.5, -3], az: 24, el: 31, zoom: 0.9 },
    { id: 'shaft',    label: 'Shaft',    target: [0, -10.5, -2],  az: 24, el: 33, zoom: 1.55 },
    { id: 'surface',  label: 'Surface',  target: [-4, 0, -6],     az: 24, el: 62, zoom: 1.2 },
    { id: 'depth',    label: 'Depth',    target: [0, -11, -2],    az: 34, el: 17, zoom: 1.3 },
  ],

  /* Presentation Mode: ordered sequence of hotspot ids (step 0 is the overview) */
  presentation: {
    sequence: ['entrance', 'reception', 'ticket', 'observation', 'corridor', 'cable', 'booth', 'punishment', 'feeding', 'square'],
    startView: 'overview',
  },

  /* Small map labels. kind: 'source' (named in the text) | 'interp' (interpretation) */
  labels: [
    { text: 'Central shaft', pos: [0, 0.4, -10.8], kind: 'source' },
    { text: 'Entrance forecourt', pos: [-35, 0.2, 2], kind: 'interp' },
    { text: 'Public concourse', pos: [-17, 0.3, -9.6], kind: 'interp' },
    { text: 'District A', pos: [-24, 0.4, -20.4], kind: 'interp' },
    { text: 'District B', pos: [-24.8, 0.4, 14.5], kind: 'interp' },
    { text: 'District C', pos: [13, 0.4, -27.4], kind: 'interp' },
    { text: 'District D', pos: [28, 0.4, -17.2], kind: 'interp' },
  ],

  /* The ten narrative locations, in presentation order.
     id            stable key — media assignments made in the Media Manager are stored under it
     name / short  title shown in the panel / short label for the map and index
     description   the full scene prompt (editable; the Media Manager can override it per browser)
     excerpt       optional short text for the info panel; if omitted, the first sentence of description is used
     position      world anchor of the marker   camera  its framed view   zone  hover volume
     media[]       default media shipped with the page (type: 'image' | 'video'); files you add in the
                   Media Manager are kept in the browser and take priority for that location
     source / interpretation   optional notes: what the text names vs. what is the artist's placement */
  hotspots: [
    { id: 'entrance', index: 1, name: 'The Entrance', short: 'Entrance', basis: 'source',
      position: [-28, 1.3, 9.4], camera: { zoom: 6.5, el: 36, az: 18, target: [-28, 0.3, 8.5] },
      zone: { center: [-28, 0.6, 8.2], size: [2.4, 1.4, 7.0] },
      description: `A woman explores a narrow underground passage that becomes progressively tighter. She eventually reaches a small opening in the wall, barely large enough for her body to pass through. Beyond the opening lies a wider, dimly illuminated corridor. The environment resembles the service corridors of an ordinary public building, with concrete walls, practical lighting and no supernatural elements. A realistic architectural scene with one human figure for scale.`,
      source: ['An entrance leading underground'], interpretation: ['Forecourt, queue posts, gate, signage and the glazed tunnel'], media: [
        { type: 'image', src: 'media/s01/01.jpg', thumb: 'media/s01/01.th.jpg' },
        { type: 'image', src: 'media/s01/02.jpg', thumb: 'media/s01/02.th.jpg' },
        { type: 'video', src: 'media/s01/03.mp4', poster: 'media/s01/03.poster.jpg', thumb: 'media/s01/03.th.jpg' },
        { type: 'image', src: 'media/s01/04.jpg', thumb: 'media/s01/04.th.jpg' },
        { type: 'image', src: 'media/s01/05.jpg', thumb: 'media/s01/05.th.jpg' }
      ] },

    { id: 'reception', index: 2, name: 'The Reception', short: 'Reception', basis: 'source',
      position: [-29.9, 0.8, -1.6], camera: { zoom: 10, el: 40, az: 20, target: [-30.5, 0.25, -2.2] },
      zone: { center: [-30.7, 0.9, -2.3], size: [4.6, 1.8, 3.0] },
      description: `A modest underground visitor reception area. A middle-aged female employee in an awkwardly tailored blue uniform sits behind a simple desk, drinking tea from a black mug. Behind her, a long shelf displays approximately fifty pairs of identical unisex felt slippers. On the desk is a bowl of assorted individually wrapped chocolates. The furniture is inexpensive but functional, the atmosphere ordinary and bureaucratic. A woman has just arrived and stands in front of the desk. Contemporary institutional interior, realistic human proportions.`,
      source: ['Reception desk and seated attendant', 'Felt slippers', 'Twist chocolates', 'Tea'], interpretation: ['Hall layout, lighting, sign wording, bench, notice board'], media: [
        { type: 'image', src: 'media/s02/01.jpg', thumb: 'media/s02/01.th.jpg' },
        { type: 'video', src: 'media/s02/02.mp4', poster: 'media/s02/02.poster.jpg', thumb: 'media/s02/02.th.jpg' },
        { type: 'image', src: 'media/s02/03.jpg', thumb: 'media/s02/03.th.jpg' }
      ] },

    { id: 'ticket', index: 3, name: 'The Ticket / Mark of Darkness', short: 'Ticket', basis: 'source',
      position: [-24.35, 0.95, -2.7], camera: { zoom: 11, el: 40, az: 20, target: [-24.4, 0.25, -2.9] },
      zone: { center: [-24.4, 0.7, -2.7], size: [2.6, 1.4, 1.9] },
      description: `At a small underground ticket counter, a female employee hands a visitor a red-and-black ten-visit admission card. On the desk are simple ticketing supplies, a mechanical ticket punch and a rubber stamp depicting Satan. The employee stamps the visitor's hand with the symbol while the visitor examines her ticket. Nearby, a clearly printed price list offers two-hour admission for 30 kroner, a day ticket for 50 kroner and a ten-visit pass for 400 kroner. The setting resembles an ordinary municipal tourist attraction with modest administrative equipment.`,
      source: ['Tickets'], interpretation: ['Counter, ticket machine and signage in the reception hall'], media: [
        { type: 'image', src: 'media/s03/01.jpg', thumb: 'media/s03/01.th.jpg' },
        { type: 'video', src: 'media/s03/02.mp4', poster: 'media/s03/02.poster.jpg', thumb: 'media/s03/02.th.jpg' }
      ] },

    { id: 'observation', index: 4, name: 'The Great Shaft', short: 'Great Shaft', basis: 'source',
      position: [-6.9, -0.7, -5.6], camera: { zoom: 3.4, el: 30, az: 24, target: [-4.6, -5.2, -4.4] },
      zone: { center: [-7.3, -1.3, -5.6], size: [4.8, 1.2, 3.8] },
      description: `An immense cylindrical underground shaft approximately three to four kilometres in diameter, surrounded by countless illuminated levels. A continuous pedestrian ramp spirals downward along its interior walls, connecting hundreds of corridors and observation platforms. Ordinary people appear as tiny figures walking through the structure. A woman stands at a safety railing near the upper edge, looking down into the enormous depth. The architecture is functional and accessible, resembling a vast underground public infrastructure complex rather than a fantasy environment. The lower levels disappear into the distance.`,
      source: ['An observation point over the central shaft', 'A route spiralling down the shaft'], interpretation: ['Scopes, bench, map board, rail design', 'Number of turns, widths, landings'], media: [
        { type: 'image', src: 'media/s04/01.jpg', thumb: 'media/s04/01.th.jpg' },
        { type: 'video', src: 'media/s04/02.mp4', poster: 'media/s04/02.poster.jpg', thumb: 'media/s04/02.th.jpg' },
        { type: 'video', src: 'media/s04/03.mp4', poster: 'media/s04/03.poster.jpg', thumb: 'media/s04/03.th.jpg' },
        { type: 'image', src: 'media/s04/04.jpg', thumb: 'media/s04/04.th.jpg' }
      ] },

    { id: 'corridor', index: 5, name: 'The Inhabitants', short: 'Inhabitants', basis: 'source',
      position: [-17.5, -0.4, -5.6], camera: { zoom: 3.6, el: 40, az: 22, target: [-17.5, -0.6, -5.6] },
      zone: { center: [-17.7, -0.7, -5.6], size: [17, 2.2, 2.6] },
      description: `A wide underground pedestrian corridor populated by ordinary men, women and a few children of different ages. Everyone wears simple everyday clothing. Most people appear shy, indifferent or emotionally withdrawn. A visiting woman tries to greet the passing inhabitants with a smile, but nobody responds or acknowledges her. A few employees in poorly fitted blue uniforms move among the crowd. The environment is an ordinary institutional circulation space with practical lighting and understated architecture. The scene is socially uncomfortable but not visually frightening.`,
      source: ['A descending passage'], interpretation: ['Handrails, lighting, bridge, wayfinding, the passers-by'], media: [
        { type: 'image', src: 'media/s05/01.jpg', thumb: 'media/s05/01.th.jpg' },
        { type: 'video', src: 'media/s05/02.mp4', poster: 'media/s05/02.poster.jpg', thumb: 'media/s05/02.th.jpg' },
        { type: 'image', src: 'media/s05/03.jpg', thumb: 'media/s05/03.th.jpg' }
      ] },

    { id: 'cable', index: 6, name: 'The Cable Car', short: 'Cable Car', basis: 'source',
      position: [24, 1.5, 0.5], camera: { zoom: 4.6, el: 38, az: 28, target: [24, 0.6, 1.0] },
      zone: { center: [24, 1.0, 1.2], size: [13, 2.2, 8.4] },
      description: `An aging cable-car system connects distant districts of an immense underground complex. Several enclosed passenger cabins travel along suspended cables between concrete station platforms. The cabins have slightly faded paint, worn metal frames and signs of years of regular use, but remain fully operational. A small group of ordinary passengers waits at a modest station with simple seating and practical directional signs. The infrastructure resembles an older European mountain cableway adapted to a vast subterranean transport network. No futuristic technology or supernatural elements.`,
      source: ['Cable cars'], interpretation: ['Station buildings, platforms, cabins, signage, pylons, other stations'], media: [
        { type: 'image', src: 'media/s06/01.jpg', thumb: 'media/s06/01.th.jpg' },
        { type: 'video', src: 'media/s06/02.mp4', poster: 'media/s06/02.poster.jpg', thumb: 'media/s06/02.th.jpg' },
        { type: 'image', src: 'media/s06/03.jpg', thumb: 'media/s06/03.th.jpg' },
        { type: 'image', src: 'media/s06/04.jpg', thumb: 'media/s06/04.th.jpg' },
        { type: 'image', src: 'media/s06/05.jpg', thumb: 'media/s06/05.th.jpg' }
      ] },

    { id: 'booth', index: 7, name: 'Hell Cola / Visitor Services', short: 'Hell Cola', basis: 'source',
      position: [2.6, -2.1, -7.1], camera: { zoom: 8.0, el: 32, az: 24, target: [2.6, -3.0, -6.4] },
      zone: { center: [2.6, -2.5, -7.0], size: [3.4, 1.4, 2.4], rotY: 160 },
      description: `A modest refreshment booth inside an enormous underground visitor complex. A female visitor shows the stamped symbol on her hand and receives a generic, unlabeled bottle of cola from an employee. There are no recognizable commercial brands. Behind the counter stand simple shelves with inexpensive drinks and refreshments. Nearby is a small stand distributing visitor maps. The scene resembles an ordinary low-budget tourist facility, with a functional counter, practical signage and restrained contemporary architecture. The visitor examines the disappointing drink with mild curiosity.`,
      source: ['Map and refreshments'], interpretation: ['Landing, counter and board design, staff'], media: [
        { type: 'image', src: 'media/s07/01.jpg', thumb: 'media/s07/01.th.jpg' },
        { type: 'video', src: 'media/s07/02.mp4', poster: 'media/s07/02.poster.jpg', thumb: 'media/s07/02.th.jpg' },
        { type: 'image', src: 'media/s07/03.jpg', thumb: 'media/s07/03.th.jpg' },
        { type: 'image', src: 'media/s07/04.jpg', thumb: 'media/s07/04.th.jpg' }
      ] },

    { id: 'punishment', index: 8, name: 'Scheduled Punishment', short: 'Punishment', basis: 'source',
      position: [28.0, -9.6, -12.4], camera: { zoom: 5.2, el: 36, az: 24, target: [28, -10.6, -11.2] },
      zone: { center: [28, -9.4, -11], size: [9.0, 3.2, 9.0] },
      description: `A designated visitor observation area inside an underground public institution, where a scheduled punishment demonstration is announced for 1:15 PM. An information board explains that the participants are people who were never satisfied with their lives despite having everything they needed. Visitors stand behind a safety barrier, watching a small group of distressed but fully clothed people seated in a clinical institutional setting. A nearby sign invites tourists to take photographs with the condemned. Everything is organized with the mundane efficiency of a public attraction. No blood, gore or graphic violence.`,
      source: ['Scheduled punishments', 'People who were never satisfied with their lives despite having everything they needed'], interpretation: ['Room layout and furnishing, gallery, photography point, timetable board, waiting area, signage', 'Location in District D'], media: [
        { type: 'image', src: 'media/s08/01.jpg', thumb: 'media/s08/01.th.jpg' },
        { type: 'video', src: 'media/s08/02.mp4', poster: 'media/s08/02.poster.jpg', thumb: 'media/s08/02.th.jpg' },
        { type: 'image', src: 'media/s08/03.jpg', thumb: 'media/s08/03.th.jpg' },
        { type: 'image', src: 'media/s08/04.jpg', thumb: 'media/s08/04.th.jpg' },
        { type: 'image', src: 'media/s08/05.jpg', thumb: 'media/s08/05.th.jpg' }
      ] },

    { id: 'feeding', index: 9, name: 'Feeding Satan', short: 'Feeding Satan', basis: 'source',
      position: [-18.3, -14.0, 11.7], camera: { zoom: 5.4, el: 36, az: 24, target: [-19, -14.8, 12.2] },
      zone: { center: [-19, -14.2, 13], size: [7.0, 3.0, 7.0] },
      description: `A public feeding attraction within a contemporary underground tourist facility. Visitors gather around a designated viewing platform at 3:00 PM, holding small paper bags of specially prepared devil food purchased from nearby kiosks. A large enclosed area is reserved for Satan, treated as though it were an ordinary scheduled animal-feeding exhibit. The visitors appear curious and relaxed, while staff members supervise the activity with calm professionalism. Practical safety barriers, clear institutional signage and standard visitor facilities. The scene is absurd because everyone behaves completely normally.`,
      source: ['Feeding of Satan'], interpretation: ['Enclosure, barrier, seating, kiosk, schedule sign and staff', 'Location in District B'], media: [
        { type: 'image', src: 'media/s09/01.jpg', thumb: 'media/s09/01.th.jpg' },
        { type: 'video', src: 'media/s09/02.mp4', poster: 'media/s09/02.poster.jpg', thumb: 'media/s09/02.th.jpg' },
        { type: 'video', src: 'media/s09/03.mp4', poster: 'media/s09/03.poster.jpg', thumb: 'media/s09/03.th.jpg' },
        { type: 'video', src: 'media/s09/04.mp4', poster: 'media/s09/04.poster.jpg', thumb: 'media/s09/04.th.jpg' },
        { type: 'image', src: 'media/s09/05.jpg', thumb: 'media/s09/05.th.jpg' },
        { type: 'image', src: 'media/s09/06.jpg', thumb: 'media/s09/06.th.jpg' }
      ] },

    { id: 'square', index: 10, name: `Satan's Tango / Citizens' Square`, short: `Satan's Tango`, basis: 'source',
      position: [0, -19.6, 1.4], camera: { zoom: 4.4, el: 60, az: 24, target: [0.5, -21.0, -2.6] },
      zone: { center: [0, -20.6, 1.2], size: [15, 1.8, 9.6] },
      description: `A spacious underground public square known as Citizens' Square, surrounded by ordinary institutional buildings, corridors and elevated walkways. At precisely 6:00 PM, a scheduled event called Satan's Tango begins. A group of ordinary men and women gathers in the central open area, preparing to dance together. A few visitors watch from benches and surrounding platforms. The space resembles a modern municipal cultural centre or public plaza, with modest lighting, everyday clothing and functional architectural details. No fantasy decorations, flames or supernatural visual effects.`,
      source: [`Citizens' Square`], interpretation: ['Pavilions, benches, kiosk, lamps, signage'], media: [
        { type: 'video', src: 'media/s10/01.mp4', poster: 'media/s10/01.poster.jpg', thumb: 'media/s10/01.th.jpg' },
        { type: 'video', src: 'media/s10/02.mp4', poster: 'media/s10/02.poster.jpg', thumb: 'media/s10/02.th.jpg' },
        { type: 'image', src: 'media/s10/03.jpg', thumb: 'media/s10/03.th.jpg' },
        { type: 'image', src: 'media/s10/04.jpg', thumb: 'media/s10/04.th.jpg' }
      ] },
  ],
};
