/* Shared content for all three directions.
   Every CV / book fact carries a `src` key that points at SOURCES below.
   `flag` marks something that needs Nye to confirm (rendered subtly as a dotted underline + note). */
window.SITE = {
  name: "Nye Warburton",
  fullName: "Aneurin (Nye) Warburton",
  roles: ["Creative", "Technologist", "Educator"],
  title: "Dean, School of Creative Technology (STEC) at SCAD",
  students: "My students call me “Prof. Nye.”",
  quote: "I teach artists to build for what’s coming.",
  intro: "Twenty-five years making animated characters and the tech behind them in Hollywood. Six years building SCAD’s game program. Now Dean of the School of Creative Technology, writing weekly about creativity in an age of rapid change.",
  ethos: [
    "Perfect is impossible. Become comfortable with iteration.",
    "Creativity is painful. Ideas are born from failure.",
    "Learning requires struggle. Knowledge only works if it’s earned."
  ],
  close: "Make it Happen.",
  avatar: (window.ROOT || "../") + "assets/img/nyehead.png",
  avatarAlt: "Cartoon portrait of Nye — black-and-white head in a circle",
  links: [
    { label: "Paragraph", href: "https://paragraph.com/@nyewarburton.eth" },
    { label: "Substack", href: "https://nyewarburton.substack.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nyewarburton/" },
    { label: "IMDb", href: "https://www.imdb.com/name/nm1100970/" },
    { label: "GitHub", href: "https://github.com/NyeGuy" }
  ],
  paragraph: {
    publicationId: "V98bkWzhrotAwDhbneW0",
    handle: "@nyewarburton.eth",
    api: "https://public.api.paragraph.com/api/v1",
    postUrl: slug => `https://paragraph.com/@nyewarburton.eth/${slug}`
  }
};

window.SOURCES = {
  brief:    { label: "Nye, via the Nyborg brief (Nov 2026)", href: null },
  scad:     { label: "scad.edu faculty page", href: "https://www.scad.edu/academics/faculty/nye-warburton" },
  cv:       { label: "nyewarburton.com/cv-2 (public CV)", href: "https://nyewarburton.com/cv-2/" },
  meta:     { label: "Metacritic credits", href: "https://www.metacritic.com/person/nye-warburton/" },
  imdb:     { label: "IMDb", href: "https://www.imdb.com/name/nm1100970/" },
  cargo:    { label: "Cargo Collective résumé", href: "https://cargocollective.com/nyewarburton/Resume-Credit-List" },
  amazon:   { label: "Amazon listing", href: "https://www.amazon.com/dp/B0G6XMGNHZ" },
  book:     { label: "nyewarburton.com/book", href: "https://nyewarburton.com/book/" }
};

window.CV = {
  highlights: [
    { k: "Now", v: "Dean, School of Creative Technology (STEC), Savannah College of Art and Design", when: "2026 – present", src: ["scad","brief"] },
    { k: "Built", v: "Six years building SCAD’s game program — Associate Chair, then Chair, Interactive Design & Game Development; strategy and development of SCAD Games Studio", when: "2020 – 2026", src: ["scad","brief"] },
    { k: "Hollywood", v: "Twenty-five years on animated characters and the tech behind them — character animation, previs and real-time pipelines, from feature films like The Avengers to motion-capture stages", when: "c. 1998 – 2019", src: ["brief","cv","meta"], flag: "“25 years” and “ending on mocap stages” come from Nye’s brief. The public CV says “over 20 years”; the mocap-stage chapter isn’t itemised publicly." },
    { k: "Speaking", v: "SXSW EDU 2026 · TAIG (Transformer AI Games) · PMP conference, Boston University", when: "2026", src: ["brief"] }
  ],
  sections: [
    { heading: "Leadership & Education", src: "scad", entries: [
      { when: "2026 – present", title: "Dean, School of Creative Technology (STEC)", where: "Savannah College of Art and Design, Savannah, GA", src: "scad" },
      { when: "2023 – 2026", title: "Chair, Interactive Design and Game Development", where: "SCAD, Savannah, GA", src: "scad", flag: "nyewarburton.com lists Chair as 2022 – present." },
      { when: "2020 – 2023", title: "Associate Chair, Interactive Design and Game Development", where: "SCAD, Savannah, GA", src: "scad", flag: "nyewarburton.com lists 2020 – 2022." },
      { when: "", title: "Research and teach Animation for Games (real-time characters, game mechanics, AI); responsible for the strategy and development of SCAD Games Studio", where: "SCAD", src: "scad" },
      { when: "2012 – 2014", title: "Game design and animation instructor", where: "The Art Institutes, Los Angeles / Santa Monica, CA", src: "scad" },
      { when: "1999 – 2000", title: "Animation Instructor", where: "School of Visual Arts, New York, NY", src: "cv" }
    ]},
    { heading: "Speaking", src: "brief", entries: [
      { when: "2026", title: "SXSW EDU", where: "Austin, TX", src: "brief" },
      { when: "", title: "TAIG — Transformer AI Games conference", where: "", src: "brief", flag: "Date and talk title not sourced." },
      { when: "Oct 30, 2026", title: "PMP conference", where: "Boston University", src: "brief", flag: "Talk title not sourced." },
      { when: "2015", title: "“Entrepreneurship, Animation, and the Internet of Things”", where: "Boston University", src: "scad" },
      { when: "2015", title: "“Animation and Entrepreneurship”", where: "Academy of Art, San Francisco · Cogswell College, Palo Alto", src: "scad" },
      { when: "2022 – 2024", title: "SCAD workshops: AI Implications for CG artists; Blockchains and Trust; Previsualization: History, Practice and Evolution; Intro to Machine Learning for Artists", where: "SCAD, Savannah, GA", src: "cv" }
    ]},
    { heading: "Studios & Ventures", src: "scad", entries: [
      { when: "2020 – present", title: "Co-founder and animation creative, Box Rocket Studio", where: "Los Angeles, CA", src: "scad", flag: "nyewarburton.com: “Animation Technologist / Blockchain Game System Researcher, 2019 – 2022.”" },
      { when: "2018 – 2019", title: "Head of production / COO, Aatma Studio", where: "Los Angeles, CA", src: "scad", flag: "nyewarburton.com: “Aatma Studio Rebrand / Relaunch, 2018, San Francisco.”" },
      { when: "2017 – 2018", title: "Previsualization lead and animator, Pixomondo — Star Trek: Discovery (CBS), Future Future, Skyhunter", where: "Los Angeles, CA", src: "scad" },
      { when: "2015 – 2016", title: "Founder and managing director, bloopco inc. — wearable stress-management prototypes; raised capital for a mindful-breathing app", where: "Los Angeles, CA", src: "scad" },
      { when: "2013 –", title: "Computer graphics consultant — game development, real-time animation and pipeline", where: "", src: "cv" }
    ]},
    { heading: "Film, TV & Games", src: "cv", entries: [
      { when: "2012 – 2014", title: "Previs and animation, Digital Domain — Maleficent (Disney), NBA 2K13 and Mad Max game trailers, Microsoft “Nagano”", where: "Los Angeles, CA", src: "cv" },
      { when: "2008 – 2014", title: "Senior previs artist & animator, The Third Floor — The Avengers, Thor, Oblivion, Men in Black III, Battleship, Oz the Great and Powerful, Jack the Giant Slayer, 300: Rise of an Empire, X-Men: Days of Future Past, Godzilla", where: "Los Angeles, CA", src: "cv", flag: "scad.edu dates The Third Floor 2008 – 12; the public CV has credits through 2014." },
      { when: "2007 – 2010", title: "Senior previs artist, Fox CineDev & Proof Inc. — X-Men Origins: Wolverine, Tooth Fairy, The Losers, Cats & Dogs: The Revenge of Kitty Galore", where: "Los Angeles, CA", src: "cv" },
      { when: "2007", title: "Animator, Blur Studio — Empire Earth III (Sierra), Disney Consumer Products", where: "Los Angeles, CA", src: "cv" },
      { when: "2005 – 2006", title: "Animator, Monster House (Columbia Pictures)", where: "Sony Pictures Imageworks", src: "cv" },
      { when: "2006", title: "Animator, Monsters, Inc. Laugh Floor (Disney Imagineering)", where: "3D Site, Topanga, CA", src: "cv" },
      { when: "2004", title: "Animator, The Lord of the Rings: The Third Age; The Urbz: Sims in the City; untitled James Bond game", where: "Electronic Arts, Redwood Shores, CA", src: "cv" },
      { when: "2000 – 2001", title: "Digital artist / compositor, Celebrity Deathmatch", where: "MTV Animation, New York, NY", src: "cv" },
      { when: "1998 – 1999", title: "Motion graphics artist", where: "WNAC Fox Providence", src: "cv" }
    ]},
    { heading: "Direction & Game Development", src: "cv", entries: [
      { when: "2017", title: "Live-stream game show prototype", where: "Sony Television Games", src: "cv" },
      { when: "2016", title: "Way of the Bow / PulseCat", where: "bloopco inc.", src: "cv" },
      { when: "2012 – 2015", title: "Commander Cluck (iOS), Word Eater (iOS), Stanley Kickback (HTML5), Flyer (Unreal) prototypes", where: "Los Angeles, CA", src: "cv" },
      { when: "2010", title: "MadHouse — short series (co-writer, director, animator)", where: "Fox Inkubation", src: "cv" },
      { when: "2008", title: "Benny: Escaped Convict", where: "Atom.com / Comedy Central", src: "cv" },
      { when: "2004", title: "Magnetism — thesis film", where: "Academy of Art University", src: "cv" }
    ]},
    { heading: "Awards", src: "scad", entries: [
      { when: "2004", title: "First Place Animation, “Magnetism”", where: "Academy of Art University, San Francisco", src: "scad" },
      { when: "2004", title: "Best of Show, “Magnetism”", where: "KidsEye Festival, Providence, RI", src: "scad" }
    ]},
    { heading: "Education", src: "scad", entries: [
      { when: "2004", title: "M.F.A., Computer Arts", where: "Academy of Art University, San Francisco", src: "scad" },
      { when: "1997", title: "B.A., Fine Arts", where: "University of Pennsylvania", src: "scad", flag: "nyewarburton.com says “BFA / Fine Art”. Years appear only on nyewarburton.com." },
      { when: "2003", title: "Richard Williams Animation Master Class", where: "Viborg, Denmark", src: "cv" }
    ]},
    { heading: "Also", src: "cv", entries: [
      { when: "2008 –", title: "Nyetoon comic blog; The Sanity Index; The Interdimensional Adventures of Floyd and Norm", where: "", src: "cv" },
      { when: "1995 – 2002", title: "Improvisational comedian — Without a Net, Polywumpus, Platypus Jones", where: "Philadelphia · San Francisco", src: "cv" },
      { when: "1996", title: "Cartoonist, 34th Street Magazine", where: "University of Pennsylvania", src: "cv" }
    ]}
  ]
};

window.BOOKS = {
  current: {
    title: "Nye’s Digital Lab 2025",
    subtitle: "Essays on AI, Creativity, and the Future of Making",
    cover: (window.ROOT || "../") + "assets/img/book-2025-cover.jpg",
    year: "December 2025",
    blurb: "What happens to creativity when machines can make anything? For a year I wrote an essay every week at the intersection of artificial intelligence, distributed systems and human creativity. This collection gathers 28 of my favorites, in three threads:",
    threads: [
      { t: "AI, Creativity & the Future of Making", d: "Can AI teach students? What remains essentially human when technical barriers fall?" },
      { t: "Systems, Networks & Decentralization", d: "From LEGO bricks to blockchain protocols — the patterns that outlast any single technology." },
      { t: "Education, Work & Human Flourishing", d: "Careers are evaporating and industries restructuring. Maybe that’s an opportunity to reimagine work." }
    ],
    facts: "Paperback · 280 pages · ISBN 979-8277619773 · Kindle edition · Independently published",
    buy: [
      { label: "Paperback — Amazon", href: "https://www.amazon.com/dp/B0G6XMGNHZ", note: "$20.00" },
      { label: "Kindle — Amazon", href: "https://www.amazon.com/dp/B0G67C5TP1", note: "eBook" },
      { label: "Collect the manuscript — Manifold", href: "https://manifold.xyz/@nyewarburton", note: "Limited on-chain edition (100)" },
      { label: "Read the essays free — Paragraph", href: "https://paragraph.com/@nyewarburton.eth", note: "All 28, plus more" }
    ],
    missing: [ { label: "Bookshop.org / indie retailers", note: "No listing found — placeholder" } ]
  },
  next: { title: "Next book", status: "Coming soon", note: "Working title, threads and date to come. Sign up on Paragraph to hear first." }
};
