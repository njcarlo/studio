// ─── Static data for C2S Finder ──────────────────────────────────────────────

export type GroupTag =
    | 'Young Adults' | 'Single Only' | 'Teens'
    | 'Adults' | 'Couples: Married' | 'Couples: Married with Kids'
    | 'College Students' | 'New' | 'Men Only' | 'Women' | 'Family';

export interface C2SGroup {
    id: string;
    name: string;
    description: string;
    tags: { label: string; color: string }[];
    ageGroup: 'All' | 'Teens' | 'College Students' | 'Young Adults' | 'Adults';
    leader: string;
    location: string;
    barangay: string;
    schedule: string;
    meetupDay: string;
    ageRange: string;
    status: 'Open' | 'Closed';
    lat: number;
    lng: number;
    isFeatured?: boolean;
}

export interface LiveScheduleItem { time: string; label: string; }

export const LIVE_SCHEDULE: LiveScheduleItem[] = [
    { time: '5:00 AM – 6:45 AM', label: '' },
    { time: '7:00 AM – 8:45 AM', label: '' },
    { time: '9:30 AM – 10:45 AM', label: '' },
    { time: '11:00 AM – 12:45 PM', label: '' },
    { time: '1:00 PM – 2:45 PM', label: '' },
    { time: '3:00 PM – 4:45 PM', label: '' },
    { time: '5:00 PM – 6:45 PM', label: '' },
    { time: '7:00 PM – 8:45 PM', label: '' },
];

export const YOUTUBE_LIVE_ID = 'O0WewzcECwg';

const TEAL   = 'bg-[#e0f7f5] text-[#0b9b8a]';
const PINK   = 'bg-[#fde8ef] text-[#e6184d]';
const BLUE   = 'bg-[#e0f0ff] text-[#1971c2]';
const GREEN  = 'bg-[#d3f9f0] text-[#0c8a6e]';
const YELLOW = 'bg-[#fff9c4] text-[#b8860b]';
const PURPLE = 'bg-[#ede9fe] text-[#6741d9]';

// Dasmariñas City center: 14.3294, 120.9367
export const C2S_GROUPS: C2SGroup[] = [
    {
        id: '1',
        name: 'Orchard Residences',
        description: 'A vibrant group for young adults growing in faith and fellowship.',
        tags: [{ label: 'Young Adults', color: TEAL }, { label: 'Single Only', color: PINK }],
        ageGroup: 'Young Adults',
        leader: 'Juan Dela Cruz',
        location: 'Burol Main',
        barangay: 'Burol',
        schedule: 'Friday · 7:00 PM',
        meetupDay: 'Friday',
        ageRange: 'Ages 25-35',
        status: 'Open',
        lat: 14.3450, lng: 120.9280,
        isFeatured: true,
    },
    {
        id: '2',
        name: 'DBB-B',
        description: 'A vibrant group for young adults growing in faith and fellowship.',
        tags: [{ label: 'Adults', color: PINK }, { label: 'Couples: Married', color: TEAL }],
        ageGroup: 'Adults',
        leader: 'Pedro Santos',
        location: 'Paliparan III',
        barangay: 'Paliparan III',
        schedule: 'Saturday · 7:00 PM',
        meetupDay: 'Saturday',
        ageRange: 'Ages 28-45',
        status: 'Open',
        lat: 14.3380, lng: 120.9520,
        isFeatured: true,
    },
    {
        id: '3',
        name: 'Greenfields 1',
        description: 'A vibrant group for young adults growing in faith and fellowship.',
        tags: [{ label: 'College Students', color: TEAL }, { label: 'New', color: YELLOW }],
        ageGroup: 'College Students',
        leader: 'Maria Reyes',
        location: 'Sampaloc I',
        barangay: 'Sampaloc I',
        schedule: 'Friday · 7:00 PM',
        meetupDay: 'Friday',
        ageRange: 'Ages 18-22',
        status: 'Open',
        lat: 14.3180, lng: 120.9400,
        isFeatured: true,
    },
    {
        id: '4',
        name: 'Mary Cris Complex',
        description: 'A vibrant group for young adults growing in faith and fellowship.',
        tags: [{ label: 'Men Only', color: BLUE }],
        ageGroup: 'Adults',
        leader: 'Roberto Cruz',
        location: 'San Antonio de Padua',
        barangay: 'San Antonio De Padua I',
        schedule: 'Saturday · 7:00 PM',
        meetupDay: 'Saturday',
        ageRange: 'Ages 30-50',
        status: 'Open',
        lat: 14.3250, lng: 120.9600,
        isFeatured: true,
    },
    {
        id: '5',
        name: 'Salitran Heights',
        description: 'A vibrant group for families growing together in God\'s word.',
        tags: [{ label: 'Family', color: PURPLE }],
        ageGroup: 'Adults',
        leader: 'Jose Aquino',
        location: 'Salitran III',
        barangay: 'Salitran III',
        schedule: 'Thursday · 7:00 PM',
        meetupDay: 'Thursday',
        ageRange: 'Ages 30-50',
        status: 'Open',
        lat: 14.3320, lng: 120.9200,
        isFeatured: false,
    },
    {
        id: '6',
        name: 'Emmanuel Homes',
        description: 'A vibrant group for young adults growing in faith and fellowship.',
        tags: [{ label: 'Young Adults', color: TEAL }, { label: 'Single Only', color: PINK }],
        ageGroup: 'Young Adults',
        leader: 'Ana Lim',
        location: 'Emmanuel Bergado I',
        barangay: 'Emmanuel Bergado I',
        schedule: 'Wednesday · 7:00 PM',
        meetupDay: 'Wednesday',
        ageRange: 'Ages 20-30',
        status: 'Open',
        lat: 14.3550, lng: 120.9350,
        isFeatured: false,
    },
    {
        id: '7',
        name: 'Fatima Sector',
        description: 'A group for teens discovering their faith journey.',
        tags: [{ label: 'Teens', color: GREEN }],
        ageGroup: 'Teens',
        leader: 'Carmen Villanueva',
        location: 'Fatima I',
        barangay: 'Fatima I',
        schedule: 'Saturday · 3:00 PM',
        meetupDay: 'Saturday',
        ageRange: 'Ages 13-17',
        status: 'Open',
        lat: 14.3480, lng: 120.9450,
        isFeatured: false,
    },
    {
        id: '8',
        name: 'San Agustin Cell',
        description: 'A vibrant group for couples growing in faith together.',
        tags: [{ label: 'Couples: Married', color: TEAL }, { label: 'Couples: Married with Kids', color: PINK }],
        ageGroup: 'Adults',
        leader: 'Dante and Luz Flores',
        location: 'San Agustin I',
        barangay: 'San Agustin I',
        schedule: 'Friday · 7:00 PM',
        meetupDay: 'Friday',
        ageRange: 'Ages 28-40',
        status: 'Open',
        lat: 14.3100, lng: 120.9500,
        isFeatured: false,
    },
    {
        id: '9',
        name: 'Langkaan Connect',
        description: 'A vibrant group for young adults growing in faith and fellowship.',
        tags: [{ label: 'Young Adults', color: TEAL }],
        ageGroup: 'Young Adults',
        leader: 'Rico Santos',
        location: 'Langkaan I',
        barangay: 'Langkaan I',
        schedule: 'Thursday · 7:00 PM',
        meetupDay: 'Thursday',
        ageRange: 'Ages 22-32',
        status: 'Open',
        lat: 14.2980, lng: 120.9320,
        isFeatured: false,
    },
];

export const ALL_TAGS: string[] = [
    'Young Adults', 'Single Only', 'Teens', 'Adults',
    'Couples: Married', 'Couples: Married with Kids',
    'College Students', 'Men Only', 'Women', 'Family', 'New',
];

// ─── Potential Mentees static data ───────────────────────────────────────────
export interface PotentialMentee {
    id: string;
    initials: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    source: 'From C2S Group Finder' | 'Recommended';
    sourceColor: string;
    requestedGroup: string;
    notes: string;
    status: 'Pending' | 'Accepted' | 'Recommended';
    // profile fields
    email: string;
    birthday: string;
    facebook: string;
    firstAttended: string;
    progress: number;
    currentModule: string;
    currentLesson: string;
    trainings: { label: string; year: string }[];
}

export const POTENTIAL_MENTEES: PotentialMentee[] = [
    {
        id: 'pm1', initials: 'JR', name: 'Jasmine Reyes',
        age: 22, gender: 'Female', phone: '+63 917 555 0142',
        source: 'From C2S Group Finder', sourceColor: 'bg-[#e0f7f5] text-[#0b9b8a]',
        requestedGroup: 'Orchard Residences',
        notes: 'Interested in joining the Young Adults Fellowship.',
        status: 'Pending',
        email: 'jasmine.r@gmail.com', birthday: '09/12/1999',
        facebook: 'Jasmine Reyes', firstAttended: '01/15/2019',
        progress: 25,
        currentModule: 'Module 2 — Life of a Winner',
        currentLesson: 'Lesson 2: The "I" That Matters Most',
        trainings: [
            { label: 'CLDP 1', year: '2021' }, { label: 'CLDP 2', year: '2021' },
            { label: 'CLDP 3', year: '2023' }, { label: 'LIFE Movers', year: '—' },
            { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' },
            { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' },
            { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' },
        ],
    },
    {
        id: 'pm2', initials: 'MS', name: 'Marco Santos',
        age: 33, gender: 'Male', phone: '+63 917 555 0142',
        source: 'From C2S Group Finder', sourceColor: 'bg-[#e0f7f5] text-[#0b9b8a]',
        requestedGroup: 'Orchard Residences',
        notes: 'Interested in joining the Young Adults Fellowship.',
        status: 'Pending',
        email: 'marco.santos@gmail.com', birthday: '03/05/1990',
        facebook: 'Marco Santos', firstAttended: '06/20/2020',
        progress: 10,
        currentModule: 'Module 1 — Foundations',
        currentLesson: 'Lesson 1: Who Am I in Christ',
        trainings: [
            { label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' },
            { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' },
            { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' },
            { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' },
            { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' },
        ],
    },
    {
        id: 'pm3', initials: 'AM', name: 'Aira Mendoza',
        age: 27, gender: 'Female', phone: '+63 916 457 0862',
        source: 'Recommended', sourceColor: 'bg-[#ede9fe] text-[#6741d9]',
        requestedGroup: 'Orchard Residences',
        notes: 'Interested in joining the Young Adults Fellowship.',
        status: 'Pending',
        email: 'aira.m@gmail.com', birthday: '09/12/1999',
        facebook: 'Aira Mendoza', firstAttended: '01/15/2019',
        progress: 25,
        currentModule: 'Module 2 — Life of a Winner',
        currentLesson: 'Lesson 2: The "I" That Matters Most',
        trainings: [
            { label: 'CLDP 1', year: '2021' }, { label: 'CLDP 2', year: '2021' },
            { label: 'CLDP 3', year: '2023' }, { label: 'LIFE Movers', year: '—' },
            { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' },
            { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' },
            { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' },
        ],
    },
];
export const MEETUP_DAYS = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── Members / Profile static data ───────────────────────────────────────────

export interface GroupMember {
    id: string;
    initials: string;
    name: string;
    currentModule: string;
    currentLesson: string;
    progress: number; // 0-100
    status: 'Active' | 'Pending Review' | 'Inactive';
    // profile fields
    email: string;
    phone: string;
    birthday: string;
    facebook: string;
    firstAttended: string;
    trainings: { label: string; year: string }[];
}

export const GROUP_MEMBERS: Record<string, GroupMember[]> = {
    'Orchard Residences': [
        {
            id: 'm1', initials: 'AC', name: 'Anna Cruz',
            currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
            progress: 25, status: 'Pending Review',
            email: 'anna.cruz@gmail.com', phone: '0917 555 1023',
            birthday: '09/12/1999', facebook: 'Anna Cruz', firstAttended: '01/15/2019',
            trainings: [
                { label: 'CLDP 1', year: '2021' }, { label: 'CLDP 2', year: '2021' },
                { label: 'CLDP 3', year: '2023' }, { label: 'LIFE Movers', year: '—' },
                { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' },
                { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' },
                { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' },
            ],
        },
        {
            id: 'm2', initials: 'DP', name: 'Daniel Park',
            currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
            progress: 25, status: 'Active',
            email: 'daniel.park@gmail.com', phone: '0918 222 3344',
            birthday: '03/05/2000', facebook: 'Daniel Park', firstAttended: '06/20/2020',
            trainings: [
                { label: 'CLDP 1', year: '2022' }, { label: 'CLDP 2', year: '2022' },
                { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' },
                { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' },
                { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' },
                { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' },
            ],
        },
    ],
    'DBB-B': [
        {
            id: 'm3', initials: 'MS', name: 'Maria Santos',
            currentModule: 'Module 1 — Foundations', currentLesson: 'Lesson 3: Grace and Truth',
            progress: 60, status: 'Active',
            email: 'maria.santos@gmail.com', phone: '0919 111 2222',
            birthday: '07/18/1990', facebook: 'Maria Santos', firstAttended: '03/10/2018',
            trainings: [
                { label: 'CLDP 1', year: '2019' }, { label: 'CLDP 2', year: '2020' },
                { label: 'CLDP 3', year: '2021' }, { label: 'LIFE Movers', year: '2022' },
                { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' },
                { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' },
                { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' },
            ],
        },
    ],
    'Greenfields 1': [
        {
            id: 'm4', initials: 'JR', name: 'Jose Reyes',
            currentModule: 'Module 3 — Kingdom Living', currentLesson: 'Lesson 1: Called to Serve',
            progress: 40, status: 'Active',
            email: 'jose.reyes@gmail.com', phone: '0916 777 8888',
            birthday: '11/22/2001', facebook: 'Jose Reyes', firstAttended: '08/05/2021',
            trainings: [
                { label: 'CLDP 1', year: '2022' }, { label: 'CLDP 2', year: '—' },
                { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' },
                { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' },
                { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' },
                { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' },
            ],
        },
    ],
};

// ─── Subdivisions per Barangay (HOA List 2026) ───────────────────────────────
export const SUBDIVISIONS_BY_BARANGAY: Record<string, string[]> = {
    'Burol': [
        // Burol 1
        'Town & Country Ph. 1',
        'Windward Hills',
        // Burol Main
        'Amaris Homes Dasma Ph. 2',
        'Chester Place',
        'Corner Stone',
        'Cresent Hills',
        'Summerwind Village Phase IV',
        'Villa Isabel Village',
        'Villa Nicasia',
    ],
    'Burol I': [
        'Town & Country Ph. 1',
        'Windward Hills',
    ],
    'Burol III': [
        'Acacia Homes',
        'Tierra Verde',
        'Windsor Homes',
    ],
    'Fatima I': [
        'Umakap Ka',
    ],
    'Langkaan I': [
        'Abot Kamay',
        'Cedarwood',
        'Grand Garden Villas',
        'Kazari Residence',
        'Westwood Highlands',
        'Pamela Homes',
        'Pueblo Cillo',
        'Tierra Vista Ayana Ph. 1',
        'Tierra Vista Ayana Ph. 2',
        'Tierra Vista',
        'Villa Elena Ph. 1',
        'Villa Elena Ph. 2',
        'Village Park',
        'Ville De Soleil Ph. 1',
        'Ville De Soleil Ph. 2',
        'West Beverly Hills',
    ],
    'Langkaan II': [
        'Cityhomes Resortville 1',
        'Cityhomes Resortville 2',
        'Greenbreze Village 1',
        'Greenbreze Village 2',
        'Valle Verde',
        'Solar Homes Ph. 3',
    ],
    'Paliparan I': [
        'Carissa Homes Dasmariñas',
        'Dasmariñas Royale Village',
        'Greenwoods Village Ph. 1',
        'La Meseta',
        'Nostalji Enclave',
        'Pacific Parkplace Village',
        'San Marino Square',
        'Terra Alta Homes',
        'Tierra Bonita',
        'The Island Park',
    ],
    'Paliparan II': [
        'Camella Dasmariñas',
        'Mabuhay Homes 2000 Ph. 1, 2 & 4',
        'Mabuhay Homes 2000 Ph. 3',
        'Amalfi',
        'St. Joseph Ridge View',
    ],
    'Paliparan III': [
        'Bahay Karangalan',
        'Bahay Katuparan',
        'Mabuhay City Dasmariñas Ph. 1-4',
        'Ph. 2 Extension Mabuhay City',
    ],
    'Sabang': [
        'Dasmariñas Townsville',
        'Dexterville Classic',
        'Golden Ville 1',
        'Golden Ville 2',
        'Greensborough',
        'Sunnydale Homes',
        'Sunrise Hills',
        'United Southplains',
    ],
    'Salawag': [
        'Armstrong Village',
        'Avida Residences Dasmariñas',
        'Avida Sta. Cecilia',
        'City of San Marino',
        'Diamond Village (Dasma 2)',
        'Fairway View',
        'Golden City Dasma 1 Ph. 1-5',
        'Golden City Dasma 3 Ph. 6, 7 & 8',
        'Golden City Dasma 4 Ph. 9 & 10',
        'Greenmeadows @ The Orchard',
        'Mabuhay Homes 2000 Ph. V',
        'North & South Dasma Garden Villas',
        'Raintree (Raintree & Oakridge)',
        'San Marino Classic',
        'San Marino Heights',
        'Avida Sta. Catalina Village Ph. 1',
        'Avida Sta. Catalina Village Ph. 2',
        'Avida Sta. Catalina Village Ph. 3',
        'The Promenade Residences',
        'Upehco',
        'Viva Homes Estates',
        'Westridge Residences',
    ],
    'Salitran I': [
        'Da-Ra Homes',
        'Diamond Village',
        'Southfields Executive Village',
    ],
    'Salitran II': [
        'Amaris Homes Dasma Ph. 1',
        'Arcontica Village',
        'Cresta Bonita',
        'Fiesta South',
        'Ivory Crest Village',
        'Sunny Crest Village',
        'United Southplains',
        'Villa Remedios',
    ],
    'Salitran III': [
        "Cardinal's Dasmariñas Village Ph. 1",
        "First United Homeowners Ass. Inc. Cardinal's Dasmariñas Village Ph. 2",
        'Molino Homes',
        'Munting Nayon',
        'South Garden Homes',
        'St. Anthony Village',
        'Summer Meadows',
        'Summerwind Village 1',
        'Summerwind Village 2',
        'Summerwind Village 3',
    ],
    'Salitran IV': [
        'Andrea Ville Homes Ph. 1',
        'Andrea Ville Homes Ph. 2',
        'Garden Grove',
        'Mango Village',
        'South Meridian Ph. 1',
        'South Meridian Ph. 2',
        'South Meridian Ph. 3',
        'Town & Country Ph. 2',
    ],
    'Sampaloc I': [
        "Cardinal's Dasmaville",
        'Kingsland Village',
        'Metrogate Dasmariñas II',
        'Doña Mercedes Village',
        'La Mediterranea',
    ],
    'Sampaloc II': [
        'Caragao',
        'Don Gregorio Heights I',
        'Greenfield Heights',
        'Regency Executive Townhomes',
        'Washington Place',
        'Mahogany',
        'Blessed Ville',
        'Greensite',
        '11th Avenue',
        'Munting Antipolo',
    ],
    'Sampaloc III': [
        'Airmens Village',
        'Carmel Heights Royale',
        'Cityview II Dasmariñas',
        'Fatima Heights',
        'Gawad Kalinga SMDC Bayanihan Village',
        'Greenbreze Village 4',
        'Greenwoods',
        'Ligayaville',
        "Seamen's Village",
        'Villa Linda',
    ],
    'Sampaloc IV': [
        'Bahay Pangarap 2000',
        'Cityhomes Dasmariñas',
        'St. Charbel South',
        'University Hills Estate',
    ],
    'San Agustin I': [
        'Metrogate Dasmariñas',
        "Robinson's Vineyard Ph. 2",
        "Robinson's Vineyard Ph. 3",
        "Robinson's Vineyard Ph. 4",
        'Solar Homes Ph. 1',
        'Solar Homes Ph. 2',
        'Vine Village',
        'The Villas @ Dasmariñas Highland',
        'Greenbreze Village 3',
    ],
    'San Agustin II': [
        'Augustine Grove',
        'Manuela Ville',
        'Southcrest Village',
        'Via Verde Village',
    ],
    'San Agustin III': [
        'Villa Catalina',
        'Villa Luisa Homes Ph. 1',
        'Villa Luisa Homes Ph. 2',
        'Villa Luisa Homes Ph. 3',
        'Villa Luisa Homes Ph. 4',
    ],
    'San Jose': [
        'Del Remedios',
        'Emerald Crest',
        'Fiesta Homes',
        'Lagmay',
        'Medina Ville',
        'Satellite Homes I',
        'Satellite Homes 2',
        'Satellite Homes 3',
        "St. Mary's Homes",
        'United Southplains',
        'Vista Bonita',
        'Wood Estate',
    ],
    'San Manuel II': [
        'Congressional South',
    ],
    'San Nicolas II': [
        'Dexterville Royale',
    ],
    'Saint Peter I': [
        'Postal Village',
    ],
    'Zone I': [
        'Agustina Village',
        'Don Gregorio Heights II',
        'San Lorenzo Heights',
    ],
    'Zone III': [
        'Dasmariñas Executive Village',
        'Deniella Homes',
        'Roseville Subdivision',
        'Kahaya',
    ],
};

export const BARANGAYS = [
    'Burol','Burol I','Burol II','Burol III','Datu Esmael',
    'Emmanuel Bergado I','Emmanuel Bergado II',
    'Fatima I','Fatima II','Fatima III','H-2',
    'Langkaan I','Langkaan II','Luzviminda I','Luzviminda II',
    'Paliparan I','Paliparan II','Paliparan III','Sabang',
    'Saint Peter I','Saint Peter II','Salawag',
    'Salitran I','Salitran II','Salitran III','Salitran IV',
    'Sampaloc I','Sampaloc II','Sampaloc III','Sampaloc IV','Sampaloc V',
    'San Agustin I','San Agustin II','San Agustin III',
    'San Andres I','San Andres II',
    'San Antonio De Padua I','San Antonio De Padua II',
    'San Dionisio','San Esteban','San Francisco I','San Francisco II',
    'San Isidro Labrador I','San Isidro Labrador II',
    'San Jose','San Juan','San Lorenzo Ruiz I','San Lorenzo Ruiz II',
    'San Luis I','San Luis II','San Manuel I','San Manuel II','San Mateo',
    'San Miguel I','San Miguel II','San Nicolas I','San Nicolas II',
    'San Roque','San Simon',
    'Santa Cristina I','Santa Cristina II','Santa Cruz I','Santa Cruz II',
    'Santa Fe','Santa Lucia','Santa Maria',
    'Santo Cristo','Santo Niño I','Santo Niño II',
    'Victoria Reyes','Zone I','Zone I-B','Zone II','Zone III','Zone IV',
];

// ─── Active / Inactive Mentees static data ───────────────────────────────────
export interface Mentee {
    id: string;
    initials: string;
    name: string;
    assignedGroup: string;
    connectedSince: string;
    module: string;
    lesson: string;
    progress: number;
    email: string;
    phone: string;
    age: number;
    birthday: string;
    gender: string;
    facebook: string;
    firstAttended: string;
    currentModule: string;
    currentLesson: string;
    mentorNotes: string;
    trainings: { label: string; year: string }[];
}

export interface InactiveMentee {
    id: string;
    name: string;
    assignedGroup: string;
    dateInactive: string;
    lastModule: string;
    reason: 'Completed' | 'Inactive' | 'Transferred';
}

export const ACTIVE_MENTEES: Mentee[] = [
    {
        id: 'a1', initials: 'AC', name: 'Anna Cruz',
        assignedGroup: 'Orchard Residences', connectedSince: 'Jan 2026',
        module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        email: 'jasmine.r@gmail.com', phone: '0917 555 0142', age: 27,
        birthday: '09/12/1999', gender: 'Female', facebook: 'Facebook.com/Jasmine Reyes',
        firstAttended: '01/15/2019',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        mentorNotes: 'Eager to grow in the Word. Attends every session faithfully.',
        trainings: [{ label:'CLDP 1',year:'2021'},{label:'CLDP 2',year:'2021'},{label:'CLDP 3',year:'2023'},{label:'LIFE Movers',year:'—'},{label:'LIFE Ambassadors',year:'—'},{label:'LAMP',year:'—'},{label:'LW3H',year:'—'},{label:'C2S 101',year:'—'},{label:'ASP',year:'—'},{label:'KnOT',year:'—'}],
    },
    {
        id: 'a2', initials: 'JT', name: 'Joseph Tan',
        assignedGroup: 'Orchard Residences', connectedSince: 'Jan 2026',
        module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        email: 'joseph.tan@gmail.com', phone: '0918 333 4455', age: 30,
        birthday: '05/10/1994', gender: 'Male', facebook: 'Facebook.com/Joseph Tan',
        firstAttended: '03/12/2020',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        mentorNotes: 'Consistent and punctual. Actively participates in discussions.',
        trainings: [{ label:'CLDP 1',year:'2022'},{label:'CLDP 2',year:'—'},{label:'CLDP 3',year:'—'},{label:'LIFE Movers',year:'—'},{label:'LIFE Ambassadors',year:'—'},{label:'LAMP',year:'—'},{label:'LW3H',year:'—'},{label:'C2S 101',year:'—'},{label:'ASP',year:'—'},{label:'KnOT',year:'—'}],
    },
    {
        id: 'a3', initials: 'ML', name: 'Maria Lopez',
        assignedGroup: 'Orchard Residences', connectedSince: 'Jan 2026',
        module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        email: 'maria.lopez@gmail.com', phone: '0919 555 6677', age: 25,
        birthday: '11/03/1999', gender: 'Female', facebook: 'Facebook.com/Maria Lopez',
        firstAttended: '07/20/2021',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        mentorNotes: 'Very engaged and asks meaningful questions.',
        trainings: [{ label:'CLDP 1',year:'—'},{label:'CLDP 2',year:'—'},{label:'CLDP 3',year:'—'},{label:'LIFE Movers',year:'—'},{label:'LIFE Ambassadors',year:'—'},{label:'LAMP',year:'—'},{label:'LW3H',year:'—'},{label:'C2S 101',year:'—'},{label:'ASP',year:'—'},{label:'KnOT',year:'—'}],
    },
    {
        id: 'a4', initials: 'DP', name: 'Daniel Park',
        assignedGroup: 'Orchard Residences', connectedSince: 'Jan 2026',
        module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        email: 'daniel.park@gmail.com', phone: '0917 888 9900', age: 28,
        birthday: '02/14/1996', gender: 'Male', facebook: 'Facebook.com/Daniel Park',
        firstAttended: '01/05/2022',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        mentorNotes: 'Making great progress. Needs follow-up on prayer life.',
        trainings: [{ label:'CLDP 1',year:'2023'},{label:'CLDP 2',year:'—'},{label:'CLDP 3',year:'—'},{label:'LIFE Movers',year:'—'},{label:'LIFE Ambassadors',year:'—'},{label:'LAMP',year:'—'},{label:'LW3H',year:'—'},{label:'C2S 101',year:'—'},{label:'ASP',year:'—'},{label:'KnOT',year:'—'}],
    },
    {
        id: 'a5', initials: 'LG', name: 'Liza Garcia',
        assignedGroup: 'Orchard Residences', connectedSince: 'Jan 2026',
        module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        email: 'liza.garcia@gmail.com', phone: '0916 222 3344', age: 23,
        birthday: '08/30/2001', gender: 'Female', facebook: 'Facebook.com/Liza Garcia',
        firstAttended: '09/15/2022',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        mentorNotes: 'Enthusiastic and growing steadily in faith.',
        trainings: [{ label:'CLDP 1',year:'—'},{label:'CLDP 2',year:'—'},{label:'CLDP 3',year:'—'},{label:'LIFE Movers',year:'—'},{label:'LIFE Ambassadors',year:'—'},{label:'LAMP',year:'—'},{label:'LW3H',year:'—'},{label:'C2S 101',year:'—'},{label:'ASP',year:'—'},{label:'KnOT',year:'—'}],
    },
];

export const INACTIVE_MENTEES: InactiveMentee[] = [
    { id: 'i1', name: 'Rachel Sanchez',  assignedGroup: 'Orchard Residences', dateInactive: 'Dec 2025', lastModule: 'Module 4, Lesson 6', reason: 'Completed' },
    { id: 'i2', name: 'Kevin Aquino',    assignedGroup: 'Orchard Residences', dateInactive: 'Nov 2025', lastModule: 'Module 4, Lesson 2', reason: 'Inactive' },
    { id: 'i3', name: 'Trisha Bautista', assignedGroup: 'Orchard Residences', dateInactive: 'Sep 2025', lastModule: 'Module 2, Lesson 4', reason: 'Transferred' },
    { id: 'i4', name: 'Noel Villarama',  assignedGroup: 'Orchard Residences', dateInactive: 'Sep 2025', lastModule: 'Module 2, Lesson 2', reason: 'Inactive' },
];

export const AGE_GROUPS = ['All', 'Teens', 'College Students', 'Young Adults', 'Adults'];

// ─── Endorsed data ────────────────────────────────────────────────────────────
export interface EndorsedGroup {
    id: string;
    name: string;
    members: number;
    progress: number;
}

export interface EndorsedWorker {
    id: string;
    name: string;
    initials: string;
    endorsedSince: string;
    module: string;
    lesson: string;
    progress: number;
    assignedGroup: string;
    connectedSince: string;
    currentModule: string;
    currentLesson: string;
    email: string;
    phone: string;
    age: number;
    birthday: string;
    gender: string;
    facebook: string;
    firstAttended: string;
    mentorNotes: string;
    trainings: { label: string; year: string }[];
}

export const ENDORSED_GROUPS: EndorsedGroup[] = [
    { id: 'eg1', name: 'Faith Forward',    members: 2, progress: 25 },
    { id: 'eg2', name: 'Kingdom Builders', members: 2, progress: 25 },
    { id: 'eg3', name: 'Light Bearers',    members: 2, progress: 25 },
];

export const ENDORSED_WORKERS: EndorsedWorker[] = [
    {
        id: 'ew1', name: 'Rachel Bautista', initials: 'RB',
        endorsedSince: 'Jan 2026', module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        assignedGroup: 'Faith Forward', connectedSince: 'Jan 2026',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        email: 'rachel.b@gmail.com', phone: '0917 111 2233', age: 26,
        birthday: '04/18/1998', gender: 'Female', facebook: 'Facebook.com/Rachel Bautista',
        firstAttended: '02/10/2019',
        mentorNotes: 'Endorsed for her consistent discipleship walk and servant heart.',
        trainings: [
            {label:'CLDP 1',year:'2021'},{label:'CLDP 2',year:'2022'},{label:'CLDP 3',year:'2023'},
            {label:'LIFE Movers',year:'2023'},{label:'LIFE Ambassadors',year:'—'},
            {label:'LAMP',year:'—'},{label:'LW3H',year:'—'},{label:'C2S 101',year:'—'},
            {label:'ASP',year:'—'},{label:'KnOT',year:'—'},
        ],
    },
    {
        id: 'ew2', name: 'Daniel Reyes', initials: 'DR',
        endorsedSince: 'Jan 2026', module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        assignedGroup: 'Kingdom Builders', connectedSince: 'Jan 2026',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        email: 'daniel.reyes@gmail.com', phone: '0918 444 5566', age: 29,
        birthday: '09/05/1995', gender: 'Male', facebook: 'Facebook.com/Daniel Reyes',
        firstAttended: '05/20/2018',
        mentorNotes: 'Strong leader with a passion for mentoring younger members.',
        trainings: [
            {label:'CLDP 1',year:'2020'},{label:'CLDP 2',year:'2021'},{label:'CLDP 3',year:'2022'},
            {label:'LIFE Movers',year:'2022'},{label:'LIFE Ambassadors',year:'2023'},
            {label:'LAMP',year:'—'},{label:'LW3H',year:'—'},{label:'C2S 101',year:'—'},
            {label:'ASP',year:'—'},{label:'KnOT',year:'—'},
        ],
    },
];

// ─── Cluster Head static data ─────────────────────────────────────────────────

export interface C2SCoordinator {
    id: string;
    initials: string;
    name: string;
    color: string;
    barangay: string;
    phone: string;
    email: string;
    assignedPotential: number;
    pendingAssignments: number;
    avgAssignmentDays: number;
    status: 'Active' | 'Inactive';
    recentActivities: { text: string; time: string }[];
}

export const CH_COORDINATORS: C2SCoordinator[] = [
    {
        id: 'co1', initials: 'RC', name: 'Rosa Castillo', color: '#5b50d6',
        barangay: 'Burol', phone: '+63 917 100 2001', email: 'rosa.c@cogdasmarinas.org',
        assignedPotential: 8, pendingAssignments: 2, avgAssignmentDays: 3,
        status: 'Active',
        recentActivities: [
            { text: 'Assigned Jasmine Reyes to Orchard Residences', time: '2 hrs ago' },
            { text: 'Interview scheduled for Marco Santos', time: 'Yesterday' },
            { text: 'Completed follow-up for 3 potential mentees', time: '2 days ago' },
        ],
    },
    {
        id: 'co2', initials: 'BM', name: 'Ben Macaraeg', color: '#0b9b8a',
        barangay: 'Paliparan III', phone: '+63 918 200 3002', email: 'ben.m@cogdasmarinas.org',
        assignedPotential: 5, pendingAssignments: 1, avgAssignmentDays: 4,
        status: 'Active',
        recentActivities: [
            { text: 'Completed interview for Aira Mendoza', time: '4 hrs ago' },
            { text: 'New potential mentee submitted for review', time: '2 days ago' },
        ],
    },
    {
        id: 'co3', initials: 'SA', name: 'Sofia Aguila', color: '#e91e8c',
        barangay: 'Sampaloc I', phone: '+63 919 300 4003', email: 'sofia.a@cogdasmarinas.org',
        assignedPotential: 6, pendingAssignments: 3, avgAssignmentDays: 5,
        status: 'Active',
        recentActivities: [
            { text: 'Followed up with 2 unresponsive mentees', time: '1 hr ago' },
            { text: 'Updated status for 4 assignments', time: '3 days ago' },
        ],
    },
];

export interface ClusterMentor {
    id: string;
    initials: string;
    name: string;
    color: string;
    group: string;
    barangay: string;
    phone: string;
    email: string;
    numberOfGroups: number;
    activeMentees: number;
    groupCapacity: number;
    attendance: number;
    completion: number;
    devotion: number;
    status: 'Active' | 'Inactive';
}

export const CH_MENTORS: ClusterMentor[] = [
    {
        id: 'cm1', initials: 'JD', name: 'Juan Dela Cruz', color: '#5b50d6',
        group: 'Orchard Residences', barangay: 'Burol',
        phone: '+63 917 123 4567', email: 'juan.dc@cogdasmarinas.org',
        numberOfGroups: 1, activeMentees: 5, groupCapacity: 12,
        attendance: 92, completion: 78, devotion: 76, status: 'Active',
    },
    {
        id: 'cm2', initials: 'PS', name: 'Pedro Santos', color: '#e91e8c',
        group: 'DBB-B', barangay: 'Paliparan III',
        phone: '+63 918 234 5678', email: 'pedro.s@cogdasmarinas.org',
        numberOfGroups: 1, activeMentees: 4, groupCapacity: 11,
        attendance: 88, completion: 82, devotion: 75, status: 'Active',
    },
    {
        id: 'cm3', initials: 'MR', name: 'Maria Reyes', color: '#0b9b8a',
        group: 'Greenfields 1', barangay: 'Sampaloc I',
        phone: '+63 919 345 6789', email: 'maria.r@cogdasmarinas.org',
        numberOfGroups: 1, activeMentees: 3, groupCapacity: 7,
        attendance: 75, completion: 60, devotion: 52, status: 'Active',
    },
    {
        id: 'cm4', initials: 'LS', name: 'Lena Santos', color: '#e67700',
        group: 'Salitran Heights', barangay: 'Salitran III',
        phone: '+63 920 456 7890', email: 'lena.s@cogdasmarinas.org',
        numberOfGroups: 1, activeMentees: 2, groupCapacity: 10,
        attendance: 65, completion: 45, devotion: 38, status: 'Inactive',
    },
];

// Extended Potential Mentee with cluster status fields
export interface ClusterPotentialMentee extends PotentialMentee {
    clusterStatus: 'New' | 'Waiting for Assignment' | 'Assigned to Mentor' | 'Interview Scheduled' | 'Interview Completed' | 'Accepted';
    assignedCoordinator?: string;
    interviewDate?: string;
}

export const CH_POTENTIAL_MENTEES: ClusterPotentialMentee[] = [
    {
        id: 'chpm1', initials: 'JR', name: 'Jasmine Reyes',
        age: 22, gender: 'Female', phone: '+63 917 555 0142',
        source: 'From C2S Group Finder', sourceColor: 'bg-[#e0f7f5] text-[#0b9b8a]',
        requestedGroup: 'Orchard Residences',
        notes: 'Interested in joining the Young Adults Fellowship.',
        status: 'Pending',
        email: 'jasmine.r@gmail.com', birthday: '09/12/1999',
        facebook: 'Jasmine Reyes', firstAttended: '01/15/2019',
        progress: 0, currentModule: 'Module 1 — Foundations',
        currentLesson: 'Lesson 1: Who Am I in Christ',
        trainings: [{ label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
        clusterStatus: 'New',
    },
    {
        id: 'chpm2', initials: 'MS', name: 'Marco Santos',
        age: 33, gender: 'Male', phone: '+63 917 555 0143',
        source: 'From C2S Group Finder', sourceColor: 'bg-[#e0f7f5] text-[#0b9b8a]',
        requestedGroup: 'DBB-B',
        notes: 'Looking for a married couples group.',
        status: 'Pending',
        email: 'marco.santos@gmail.com', birthday: '03/05/1990',
        facebook: 'Marco Santos', firstAttended: '06/20/2020',
        progress: 0, currentModule: 'Module 1 — Foundations',
        currentLesson: 'Lesson 1: Who Am I in Christ',
        trainings: [{ label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
        clusterStatus: 'Waiting for Assignment',
        assignedCoordinator: 'Rosa Castillo',
    },
    {
        id: 'chpm3', initials: 'AM', name: 'Aira Mendoza',
        age: 27, gender: 'Female', phone: '+63 916 457 0862',
        source: 'Recommended', sourceColor: 'bg-[#ede9fe] text-[#6741d9]',
        requestedGroup: 'Greenfields 1',
        notes: 'Transferred from another cluster.',
        status: 'Pending',
        email: 'aira.m@gmail.com', birthday: '09/12/1997',
        facebook: 'Aira Mendoza', firstAttended: '01/15/2019',
        progress: 25, currentModule: 'Module 2 — Life of a Winner',
        currentLesson: 'Lesson 2: The "I" That Matters Most',
        trainings: [{ label: 'CLDP 1', year: '2021' }, { label: 'CLDP 2', year: '2021' }, { label: 'CLDP 3', year: '2023' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
        clusterStatus: 'Assigned to Mentor',
        assignedCoordinator: 'Ben Macaraeg',
    },
    {
        id: 'chpm4', initials: 'RB', name: 'Rafael Buenaventura',
        age: 29, gender: 'Male', phone: '+63 915 333 7788',
        source: 'From C2S Group Finder', sourceColor: 'bg-[#e0f7f5] text-[#0b9b8a]',
        requestedGroup: 'Orchard Residences',
        notes: 'Was referred by a current member.',
        status: 'Pending',
        email: 'rafael.b@gmail.com', birthday: '05/18/1995',
        facebook: 'Rafael B', firstAttended: '03/10/2023',
        progress: 0, currentModule: 'Module 1 — Foundations',
        currentLesson: 'Lesson 1: Who Am I in Christ',
        trainings: [{ label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
        clusterStatus: 'Interview Scheduled',
        assignedCoordinator: 'Sofia Aguila',
        interviewDate: 'Jul 26, 2026',
    },
    {
        id: 'chpm5', initials: 'NV', name: 'Nina Villanueva',
        age: 24, gender: 'Female', phone: '+63 917 444 5566',
        source: 'From C2S Group Finder', sourceColor: 'bg-[#e0f7f5] text-[#0b9b8a]',
        requestedGroup: 'DBB-B',
        notes: 'Attended two services already.',
        status: 'Pending',
        email: 'nina.v@gmail.com', birthday: '12/02/2001',
        facebook: 'Nina V', firstAttended: '06/01/2026',
        progress: 0, currentModule: 'Module 1 — Foundations',
        currentLesson: 'Lesson 1: Who Am I in Christ',
        trainings: [{ label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
        clusterStatus: 'Interview Completed',
        assignedCoordinator: 'Rosa Castillo',
        interviewDate: 'Jul 22, 2026',
    },
    {
        id: 'chpm6', initials: 'TO', name: 'Tirso Orozco',
        age: 45, gender: 'Male', phone: '+63 918 555 6677',
        source: 'Recommended', sourceColor: 'bg-[#ede9fe] text-[#6741d9]',
        requestedGroup: 'DBB-B',
        notes: 'Long-time church member seeking discipleship.',
        status: 'Accepted',
        email: 'tirso.o@gmail.com', birthday: '07/30/1980',
        facebook: 'Tirso O', firstAttended: '01/05/2015',
        progress: 10, currentModule: 'Module 1 — Foundations',
        currentLesson: 'Lesson 2: Receiving God\'s Forgiveness',
        trainings: [{ label: 'CLDP 1', year: '2017' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
        clusterStatus: 'Accepted',
        assignedCoordinator: 'Ben Macaraeg',
    },
];

export const CH_ACTIVE_MENTEES: Mentee[] = [
    {
        id: 'cha1', initials: 'AC', name: 'Anna Cruz',
        assignedGroup: 'Orchard Residences', connectedSince: 'Jan 2026',
        module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        email: 'anna.cruz@gmail.com', phone: '0917 555 1023', age: 27,
        birthday: '09/12/1999', gender: 'Female', facebook: 'Facebook.com/Anna Cruz',
        firstAttended: '01/15/2019',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        mentorNotes: 'Eager to grow in the Word.',
        trainings: [{ label: 'CLDP 1', year: '2021' }, { label: 'CLDP 2', year: '2021' }, { label: 'CLDP 3', year: '2023' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
    },
    {
        id: 'cha2', initials: 'JT', name: 'Joseph Tan',
        assignedGroup: 'DBB-B', connectedSince: 'Feb 2026',
        module: 'Module 2', lesson: 'Lesson 1', progress: 25,
        email: 'joseph.tan@gmail.com', phone: '0918 333 4455', age: 30,
        birthday: '05/10/1994', gender: 'Male', facebook: 'Facebook.com/Joseph Tan',
        firstAttended: '03/12/2020',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 1: The "I" That Matters Most',
        mentorNotes: 'Consistent and punctual.',
        trainings: [{ label: 'CLDP 1', year: '2022' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
    },
    {
        id: 'cha3', initials: 'ML', name: 'Maria Lopez',
        assignedGroup: 'Greenfields 1', connectedSince: 'Mar 2026',
        module: 'Module 1', lesson: 'Lesson 3', progress: 15,
        email: 'maria.lopez@gmail.com', phone: '0919 555 6677', age: 25,
        birthday: '11/03/1999', gender: 'Female', facebook: 'Facebook.com/Maria Lopez',
        firstAttended: '07/20/2021',
        currentModule: 'Module 1 — A Born Again Experience', currentLesson: 'Lesson 3: Highly Favored',
        mentorNotes: 'Very engaged.',
        trainings: [{ label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
    },
    {
        id: 'cha4', initials: 'DP', name: 'Daniel Park',
        assignedGroup: 'Orchard Residences', connectedSince: 'Jan 2026',
        module: 'Module 2', lesson: 'Lesson 2', progress: 35,
        email: 'daniel.park@gmail.com', phone: '0917 888 9900', age: 28,
        birthday: '02/14/1996', gender: 'Male', facebook: 'Facebook.com/Daniel Park',
        firstAttended: '01/05/2022',
        currentModule: 'Module 2 — Life of a Winner', currentLesson: 'Lesson 2: The "I" That Matters Most',
        mentorNotes: 'Making great progress.',
        trainings: [{ label: 'CLDP 1', year: '2023' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
    },
    {
        id: 'cha5', initials: 'LG', name: 'Liza Garcia',
        assignedGroup: 'DBB-B', connectedSince: 'Apr 2026',
        module: 'Module 1', lesson: 'Lesson 2', progress: 10,
        email: 'liza.garcia@gmail.com', phone: '0916 222 3344', age: 23,
        birthday: '08/30/2001', gender: 'Female', facebook: 'Facebook.com/Liza Garcia',
        firstAttended: '09/15/2022',
        currentModule: 'Module 1 — A Born Again Experience', currentLesson: 'Lesson 2: Receiving God\'s Forgiveness',
        mentorNotes: 'Enthusiastic learner.',
        trainings: [{ label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
    },
    {
        id: 'cha6', initials: 'EF', name: 'Elena Fuentes',
        assignedGroup: 'Salitran Heights', connectedSince: 'May 2026',
        module: 'Module 1', lesson: 'Lesson 1', progress: 5,
        email: 'elena.f@gmail.com', phone: '0920 111 2233', age: 31,
        birthday: '04/09/1993', gender: 'Female', facebook: 'Facebook.com/Elena Fuentes',
        firstAttended: '05/12/2026',
        currentModule: 'Module 1 — A Born Again Experience', currentLesson: 'Lesson 1: Fresh Start',
        mentorNotes: 'New to the program.',
        trainings: [{ label: 'CLDP 1', year: '—' }, { label: 'CLDP 2', year: '—' }, { label: 'CLDP 3', year: '—' }, { label: 'LIFE Movers', year: '—' }, { label: 'LIFE Ambassadors', year: '—' }, { label: 'LAMP', year: '—' }, { label: 'LW3H', year: '—' }, { label: 'C2S 101', year: '—' }, { label: 'ASP', year: '—' }, { label: 'KnOT', year: '—' }],
    },
];

export const CH_CLUSTER_GROUPS = [
    { id: 'cg1', name: 'Orchard Residences', type: 'Community-based' as const, barangay: 'Burol', mentor: 'Juan Dela Cruz', members: 12, lat: 14.3450, lng: 120.9280 },
    { id: 'cg2', name: 'DBB-B',              type: 'Church-based' as const,    barangay: 'Paliparan III', mentor: 'Pedro Santos', members: 11, lat: 14.3380, lng: 120.9520 },
    { id: 'cg3', name: 'Greenfields 1',      type: 'Community-based' as const, barangay: 'Sampaloc I', mentor: 'Maria Reyes', members: 7, lat: 14.3180, lng: 120.9400 },
    { id: 'cg4', name: 'Salitran Heights',   type: 'Community-based' as const, barangay: 'Salitran III', mentor: 'Lena Santos', members: 6, lat: 14.3320, lng: 120.9200 },
];

export const CH_NOTIFICATIONS = [
    { id: 'n1', type: 'new_potential' as const,  text: 'New potential mentee Jasmine Reyes submitted a request',        time: '2 hrs ago',  read: false },
    { id: 'n2', type: 'assignment' as const,     text: 'Marco Santos has been assigned to coordinator Rosa Castillo',   time: '4 hrs ago',  read: false },
    { id: 'n3', type: 'interview' as const,      text: 'Interview completed for Nina Villanueva',                       time: '6 hrs ago',  read: true  },
    { id: 'n4', type: 'new_potential' as const,  text: 'New potential mentee Rafael Buenaventura from C2S Group Finder', time: 'Yesterday', read: true  },
    { id: 'n5', type: 'assignment' as const,     text: 'Assignment update: Aira Mendoza assigned to Maria Reyes',       time: 'Yesterday',  read: true  },
];

// ─── C2S Coordinator static data ─────────────────────────────────────────────

export interface CoordPotentialMentee {
    id: string;
    initials: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    barangay: string;
    preferredGroups: string[];          // max 2
    groupType: 'Community-based' | 'Church-based';
    dateSubmitted: string;
    status: 'New' | 'Waiting for Assignment' | 'Assigned to Mentor' | 'Interview Scheduled' | 'Interview Completed' | 'Accepted';
    assignedMentor?: string;
    notes: string;
    facebook: string;
    birthday: string;
    firstAttended: string;
    source: 'From C2S Group Finder' | 'Recommended';
}

export const COORD_POTENTIAL_MENTEES: CoordPotentialMentee[] = [
    {
        id: 'cpm1', initials: 'JR', name: 'Jasmine Reyes', age: 22, gender: 'Female',
        phone: '+63 917 555 0142', email: 'jasmine.r@gmail.com',
        barangay: 'Burol', preferredGroups: ['Orchard Residences', 'Emmanuel Homes'],
        groupType: 'Community-based', dateSubmitted: 'Jul 18, 2026',
        status: 'New', notes: 'Interested in Young Adults Fellowship.',
        facebook: 'Jasmine Reyes', birthday: '09/12/2002', firstAttended: '06/01/2026',
        source: 'From C2S Group Finder',
    },
    {
        id: 'cpm2', initials: 'MS', name: 'Marco Santos', age: 33, gender: 'Male',
        phone: '+63 917 555 0143', email: 'marco.santos@gmail.com',
        barangay: 'Paliparan III', preferredGroups: ['DBB-B'],
        groupType: 'Church-based', dateSubmitted: 'Jul 17, 2026',
        status: 'Waiting for Assignment', notes: 'Looking for a couples group.',
        facebook: 'Marco Santos', birthday: '03/05/1990', firstAttended: '06/20/2020',
        source: 'From C2S Group Finder',
    },
    {
        id: 'cpm3', initials: 'AM', name: 'Aira Mendoza', age: 27, gender: 'Female',
        phone: '+63 916 457 0862', email: 'aira.m@gmail.com',
        barangay: 'Sampaloc I', preferredGroups: ['Greenfields 1', 'Langkaan Connect'],
        groupType: 'Community-based', dateSubmitted: 'Jul 16, 2026',
        status: 'Assigned to Mentor', assignedMentor: 'Maria Reyes',
        notes: 'Transferred from another cluster.',
        facebook: 'Aira Mendoza', birthday: '09/12/1997', firstAttended: '01/15/2019',
        source: 'Recommended',
    },
    {
        id: 'cpm4', initials: 'RB', name: 'Rafael Buenaventura', age: 29, gender: 'Male',
        phone: '+63 915 333 7788', email: 'rafael.b@gmail.com',
        barangay: 'Burol', preferredGroups: ['Orchard Residences'],
        groupType: 'Community-based', dateSubmitted: 'Jul 15, 2026',
        status: 'Interview Scheduled', assignedMentor: 'Juan Dela Cruz',
        notes: 'Referred by a current member.',
        facebook: 'Rafael B', birthday: '05/18/1995', firstAttended: '03/10/2023',
        source: 'From C2S Group Finder',
    },
    {
        id: 'cpm5', initials: 'NV', name: 'Nina Villanueva', age: 24, gender: 'Female',
        phone: '+63 917 444 5566', email: 'nina.v@gmail.com',
        barangay: 'Paliparan III', preferredGroups: ['DBB-B', 'San Agustin Cell'],
        groupType: 'Church-based', dateSubmitted: 'Jul 14, 2026',
        status: 'Interview Completed', assignedMentor: 'Pedro Santos',
        notes: 'Attended two services already.',
        facebook: 'Nina V', birthday: '12/02/2001', firstAttended: '06/01/2026',
        source: 'From C2S Group Finder',
    },
    {
        id: 'cpm6', initials: 'TO', name: 'Tirso Orozco', age: 45, gender: 'Male',
        phone: '+63 918 555 6677', email: 'tirso.o@gmail.com',
        barangay: 'Salitran III', preferredGroups: ['Salitran Heights'],
        groupType: 'Community-based', dateSubmitted: 'Jul 12, 2026',
        status: 'Accepted', assignedMentor: 'Lena Santos',
        notes: 'Long-time church member seeking discipleship.',
        facebook: 'Tirso O', birthday: '07/30/1980', firstAttended: '01/05/2015',
        source: 'Recommended',
    },
    {
        id: 'cpm7', initials: 'BF', name: 'Bella Flores', age: 19, gender: 'Female',
        phone: '+63 920 888 1122', email: 'bella.f@gmail.com',
        barangay: 'Emmanuel Bergado I', preferredGroups: ['Emmanuel Homes'],
        groupType: 'Community-based', dateSubmitted: 'Jul 21, 2026',
        status: 'New', notes: 'College student, free on weekends.',
        facebook: 'Bella Flores', birthday: '03/14/2005', firstAttended: '07/06/2026',
        source: 'From C2S Group Finder',
    },
    {
        id: 'cpm8', initials: 'CR', name: 'Carlo Ramos', age: 38, gender: 'Male',
        phone: '+63 919 222 3344', email: 'carlo.r@gmail.com',
        barangay: 'Fatima I', preferredGroups: ['Fatima Sector'],
        groupType: 'Church-based', dateSubmitted: 'Jul 20, 2026',
        status: 'Waiting for Assignment', notes: 'Husband and wife interested together.',
        facebook: 'Carlo Ramos', birthday: '11/01/1985', firstAttended: '05/15/2026',
        source: 'From C2S Group Finder',
    },
];

export interface CoordMentor {
    id: string;
    initials: string;
    name: string;
    color: string;
    group: string;
    barangay: string;
    phone: string;
    email: string;
    activeMentees: number;
    groupCapacity: number;
    availableSlots: number;
    status: 'Active' | 'Inactive';
}

export const COORD_MENTORS: CoordMentor[] = [
    {
        id: 'cm1', initials: 'JD', name: 'Juan Dela Cruz', color: '#5b50d6',
        group: 'Orchard Residences', barangay: 'Burol',
        phone: '+63 917 123 4567', email: 'juan.dc@cogdasmarinas.org',
        activeMentees: 5, groupCapacity: 12, availableSlots: 7, status: 'Active',
    },
    {
        id: 'cm2', initials: 'PS', name: 'Pedro Santos', color: '#e91e8c',
        group: 'DBB-B', barangay: 'Paliparan III',
        phone: '+63 918 234 5678', email: 'pedro.s@cogdasmarinas.org',
        activeMentees: 4, groupCapacity: 11, availableSlots: 7, status: 'Active',
    },
    {
        id: 'cm3', initials: 'MR', name: 'Maria Reyes', color: '#0b9b8a',
        group: 'Greenfields 1', barangay: 'Sampaloc I',
        phone: '+63 919 345 6789', email: 'maria.r@cogdasmarinas.org',
        activeMentees: 3, groupCapacity: 7, availableSlots: 4, status: 'Active',
    },
    {
        id: 'cm4', initials: 'LS', name: 'Lena Santos', color: '#e67700',
        group: 'Salitran Heights', barangay: 'Salitran III',
        phone: '+63 920 456 7890', email: 'lena.s@cogdasmarinas.org',
        activeMentees: 2, groupCapacity: 10, availableSlots: 0, status: 'Inactive',
    },
];

export interface CoordGroup {
    id: string;
    name: string;
    mentor: string;
    mentorInitials: string;
    mentorColor: string;
    barangay: string;
    type: 'Community-based' | 'Church-based';
    members: number;
    capacity: number;
    availableSlots: number;
    status: 'Open' | 'Full' | 'Closed';
    schedule: string;
}

export const COORD_GROUPS: CoordGroup[] = [
    {
        id: 'cg1', name: 'Orchard Residences', mentor: 'Juan Dela Cruz',
        mentorInitials: 'JD', mentorColor: '#5b50d6',
        barangay: 'Burol', type: 'Community-based',
        members: 5, capacity: 12, availableSlots: 7,
        status: 'Open', schedule: 'Friday · 7:00 PM',
    },
    {
        id: 'cg2', name: 'DBB-B', mentor: 'Pedro Santos',
        mentorInitials: 'PS', mentorColor: '#e91e8c',
        barangay: 'Paliparan III', type: 'Church-based',
        members: 4, capacity: 11, availableSlots: 7,
        status: 'Open', schedule: 'Saturday · 7:00 PM',
    },
    {
        id: 'cg3', name: 'Greenfields 1', mentor: 'Maria Reyes',
        mentorInitials: 'MR', mentorColor: '#0b9b8a',
        barangay: 'Sampaloc I', type: 'Community-based',
        members: 3, capacity: 7, availableSlots: 4,
        status: 'Open', schedule: 'Friday · 7:00 PM',
    },
    {
        id: 'cg4', name: 'Salitran Heights', mentor: 'Lena Santos',
        mentorInitials: 'LS', mentorColor: '#e67700',
        barangay: 'Salitran III', type: 'Community-based',
        members: 10, capacity: 10, availableSlots: 0,
        status: 'Full', schedule: 'Thursday · 7:00 PM',
    },
    {
        id: 'cg5', name: 'Emmanuel Homes', mentor: 'Ana Lim',
        mentorInitials: 'AL', mentorColor: '#6741d9',
        barangay: 'Emmanuel Bergado I', type: 'Community-based',
        members: 6, capacity: 10, availableSlots: 4,
        status: 'Open', schedule: 'Wednesday · 7:00 PM',
    },
    {
        id: 'cg6', name: 'Fatima Sector', mentor: 'Carmen Villanueva',
        mentorInitials: 'CV', mentorColor: '#0c8a6e',
        barangay: 'Fatima I', type: 'Church-based',
        members: 8, capacity: 10, availableSlots: 2,
        status: 'Open', schedule: 'Saturday · 3:00 PM',
    },
];

export const COORD_NOTIFICATIONS = [
    { id: 'cn1', type: 'new_mentee' as const,   text: 'New potential mentee Bella Flores submitted from C2S Finder',      time: '1 hr ago',   read: false },
    { id: 'cn2', type: 'accepted' as const,      text: 'Juan Dela Cruz accepted assignment for Rafael Buenaventura',       time: '3 hrs ago',  read: false },
    { id: 'cn3', type: 'reassign' as const,      text: 'Mentee reassignment request received for Aira Mendoza',           time: '5 hrs ago',  read: false },
    { id: 'cn4', type: 'capacity' as const,      text: 'Group capacity reached: Salitran Heights is now full',            time: 'Yesterday',  read: true  },
    { id: 'cn5', type: 'interview' as const,     text: 'Interview completed for Nina Villanueva by Pedro Santos',         time: 'Yesterday',  read: true  },
    { id: 'cn6', type: 'new_mentee' as const,    text: 'New potential mentee Carlo Ramos submitted from C2S Finder',      time: '2 days ago', read: true  },
];

// ─── Ministry Head (Outreach Ministry) static data ───────────────────────────

export interface OutreachCluster {
    id: string;
    name: string;
    clusterHead: string;
    clusterHeadInitials: string;
    clusterHeadColor: string;
    coordinator: string;
    coordinatorInitials: string;
    coordinatorColor: string;
    totalGroups: number;
    totalMentors: number;
    totalPotentialMentees: number;
    totalActiveMentees: number;
    communityBased: number;
    churchBased: number;
    barangays: string[];
    lat: number;
    lng: number;
}

export const MH_CLUSTERS: OutreachCluster[] = [
    {
        id: 'cl1',
        name: 'Cluster 1',
        clusterHead: 'Liza Evangelista',
        clusterHeadInitials: 'LE',
        clusterHeadColor: '#5b50d6',
        coordinator: 'Rosa Castillo',
        coordinatorInitials: 'RC',
        coordinatorColor: '#e91e8c',
        totalGroups: 4,
        totalMentors: 4,
        totalPotentialMentees: 8,
        totalActiveMentees: 14,
        communityBased: 3,
        churchBased: 1,
        barangays: ['Burol', 'Paliparan III', 'Sampaloc I', 'Salitran III'],
        lat: 14.3350, lng: 120.9350,
    },
    {
        id: 'cl2',
        name: 'Cluster 2',
        clusterHead: 'Marco Villanueva',
        clusterHeadInitials: 'MV',
        clusterHeadColor: '#0b9b8a',
        coordinator: 'Ben Macaraeg',
        coordinatorInitials: 'BM',
        coordinatorColor: '#6741d9',
        totalGroups: 3,
        totalMentors: 3,
        totalPotentialMentees: 6,
        totalActiveMentees: 10,
        communityBased: 2,
        churchBased: 1,
        barangays: ['Emmanuel Bergado I', 'Fatima I', 'Langkaan I'],
        lat: 14.3480, lng: 120.9450,
    },
    {
        id: 'cl3',
        name: 'Cluster 3',
        clusterHead: 'Elena Fuentes',
        clusterHeadInitials: 'EF',
        clusterHeadColor: '#e67700',
        coordinator: 'Sofia Aguila',
        coordinatorInitials: 'SA',
        coordinatorColor: '#0b9b8a',
        totalGroups: 5,
        totalMentors: 5,
        totalPotentialMentees: 10,
        totalActiveMentees: 18,
        communityBased: 4,
        churchBased: 1,
        barangays: ['San Agustin I', 'San Andres I', 'San Jose', 'San Miguel I', 'Victoria Reyes'],
        lat: 14.3150, lng: 120.9550,
    },
    {
        id: 'cl4',
        name: 'Cluster 4',
        clusterHead: 'Ramon Dela Cruz',
        clusterHeadInitials: 'RD',
        clusterHeadColor: '#1971c2',
        coordinator: 'Patricia Bautista',
        coordinatorInitials: 'PB',
        coordinatorColor: '#e67700',
        totalGroups: 4,
        totalMentors: 4,
        totalPotentialMentees: 7,
        totalActiveMentees: 12,
        communityBased: 3,
        churchBased: 1,
        barangays: ['Salawag', 'Sabang', 'Salitran I', 'Salitran II'],
        lat: 14.3280, lng: 120.9260,
    },
    {
        id: 'cl5',
        name: 'Cluster 5',
        clusterHead: 'Cynthia Torres',
        clusterHeadInitials: 'CT',
        clusterHeadColor: '#e91e8c',
        coordinator: 'Ferdinand Ramos',
        coordinatorInitials: 'FR',
        coordinatorColor: '#5b50d6',
        totalGroups: 3,
        totalMentors: 3,
        totalPotentialMentees: 5,
        totalActiveMentees: 9,
        communityBased: 2,
        churchBased: 1,
        barangays: ['Langkaan II', 'Paliparan I', 'Paliparan II'],
        lat: 14.3420, lng: 120.9600,
    },
    {
        id: 'cl6',
        name: 'Cluster 6',
        clusterHead: 'Danilo Reyes',
        clusterHeadInitials: 'DR',
        clusterHeadColor: '#0c8a6e',
        coordinator: 'Maricel Santos',
        coordinatorInitials: 'MS',
        coordinatorColor: '#1971c2',
        totalGroups: 4,
        totalMentors: 4,
        totalPotentialMentees: 9,
        totalActiveMentees: 15,
        communityBased: 3,
        churchBased: 1,
        barangays: ['Sampaloc II', 'Sampaloc III', 'Sampaloc IV', 'San Agustin II'],
        lat: 14.3080, lng: 120.9480,
    },
];

export interface MHCoordinator {
    id: string;
    initials: string;
    name: string;
    color: string;
    cluster: string;
    assignedPotentialMentees: number;
    activeMentors: number;
    status: 'Active' | 'Inactive';
}

export const MH_COORDINATORS: MHCoordinator[] = [
    { id: 'mhco1', initials: 'RC', name: 'Rosa Castillo',      color: '#e91e8c', cluster: 'Cluster 1', assignedPotentialMentees: 8,  activeMentors: 4, status: 'Active' },
    { id: 'mhco2', initials: 'BM', name: 'Ben Macaraeg',       color: '#6741d9', cluster: 'Cluster 2', assignedPotentialMentees: 6,  activeMentors: 3, status: 'Active' },
    { id: 'mhco3', initials: 'SA', name: 'Sofia Aguila',       color: '#0b9b8a', cluster: 'Cluster 3', assignedPotentialMentees: 10, activeMentors: 5, status: 'Active' },
    { id: 'mhco4', initials: 'PB', name: 'Patricia Bautista',  color: '#e67700', cluster: 'Cluster 4', assignedPotentialMentees: 7,  activeMentors: 4, status: 'Active' },
    { id: 'mhco5', initials: 'FR', name: 'Ferdinand Ramos',    color: '#5b50d6', cluster: 'Cluster 5', assignedPotentialMentees: 5,  activeMentors: 3, status: 'Active' },
    { id: 'mhco6', initials: 'MS', name: 'Maricel Santos',     color: '#1971c2', cluster: 'Cluster 6', assignedPotentialMentees: 9,  activeMentors: 4, status: 'Active' },
];

export interface MHMentor {
    id: string;
    initials: string;
    name: string;
    color: string;
    cluster: string;
    totalGroups: number;
    activeMentees: number;
    status: 'Active' | 'Inactive';
}

export const MH_ALL_MENTORS: MHMentor[] = [
    { id: 'mhm1',  initials: 'JD', name: 'Juan Dela Cruz',      color: '#5b50d6', cluster: 'Cluster 1', totalGroups: 1, activeMentees: 5, status: 'Active'   },
    { id: 'mhm2',  initials: 'PS', name: 'Pedro Santos',        color: '#e91e8c', cluster: 'Cluster 1', totalGroups: 1, activeMentees: 4, status: 'Active'   },
    { id: 'mhm3',  initials: 'MR', name: 'Maria Reyes',         color: '#0b9b8a', cluster: 'Cluster 1', totalGroups: 1, activeMentees: 3, status: 'Active'   },
    { id: 'mhm4',  initials: 'LS', name: 'Lena Santos',         color: '#e67700', cluster: 'Cluster 1', totalGroups: 1, activeMentees: 2, status: 'Inactive' },
    { id: 'mhm5',  initials: 'AL', name: 'Ana Lim',             color: '#6741d9', cluster: 'Cluster 2', totalGroups: 1, activeMentees: 4, status: 'Active'   },
    { id: 'mhm6',  initials: 'CV', name: 'Carmen Villanueva',   color: '#0c8a6e', cluster: 'Cluster 2', totalGroups: 1, activeMentees: 3, status: 'Active'   },
    { id: 'mhm7',  initials: 'RB', name: 'Rico Bautista',       color: '#1971c2', cluster: 'Cluster 2', totalGroups: 1, activeMentees: 3, status: 'Active'   },
    { id: 'mhm8',  initials: 'EC', name: 'Ernesto Cruz',        color: '#5b50d6', cluster: 'Cluster 3', totalGroups: 1, activeMentees: 4, status: 'Active'   },
    { id: 'mhm9',  initials: 'LT', name: 'Luz Torres',          color: '#e91e8c', cluster: 'Cluster 3', totalGroups: 1, activeMentees: 4, status: 'Active'   },
    { id: 'mhm10', initials: 'NF', name: 'Noel Flores',         color: '#0b9b8a', cluster: 'Cluster 3', totalGroups: 1, activeMentees: 3, status: 'Active'   },
    { id: 'mhm11', initials: 'AM', name: 'Alma Mendoza',        color: '#e67700', cluster: 'Cluster 3', totalGroups: 1, activeMentees: 4, status: 'Active'   },
    { id: 'mhm12', initials: 'DG', name: 'Dante Garcia',        color: '#6741d9', cluster: 'Cluster 3', totalGroups: 1, activeMentees: 3, status: 'Inactive' },
    { id: 'mhm13', initials: 'CP', name: 'Carlos Pineda',       color: '#1971c2', cluster: 'Cluster 4', totalGroups: 1, activeMentees: 4, status: 'Active'   },
    { id: 'mhm14', initials: 'FV', name: 'Fe Villarin',         color: '#e91e8c', cluster: 'Cluster 4', totalGroups: 1, activeMentees: 3, status: 'Active'   },
    { id: 'mhm15', initials: 'BN', name: 'Bobby Natividad',     color: '#0c8a6e', cluster: 'Cluster 4', totalGroups: 1, activeMentees: 3, status: 'Active'   },
    { id: 'mhm16', initials: 'GQ', name: 'Gloria Quizon',       color: '#5b50d6', cluster: 'Cluster 4', totalGroups: 1, activeMentees: 2, status: 'Inactive' },
    { id: 'mhm17', initials: 'TC', name: 'Tomas Castillo',      color: '#e67700', cluster: 'Cluster 5', totalGroups: 1, activeMentees: 4, status: 'Active'   },
    { id: 'mhm18', initials: 'RI', name: 'Rowena Ignacio',      color: '#6741d9', cluster: 'Cluster 5', totalGroups: 1, activeMentees: 3, status: 'Active'   },
    { id: 'mhm19', initials: 'VB', name: 'Victor Bernardo',     color: '#1971c2', cluster: 'Cluster 5', totalGroups: 1, activeMentees: 2, status: 'Active'   },
    { id: 'mhm20', initials: 'HM', name: 'Helen Macapagal',     color: '#5b50d6', cluster: 'Cluster 6', totalGroups: 1, activeMentees: 5, status: 'Active'   },
    { id: 'mhm21', initials: 'JP', name: 'Joel Panganiban',     color: '#e91e8c', cluster: 'Cluster 6', totalGroups: 1, activeMentees: 4, status: 'Active'   },
    { id: 'mhm22', initials: 'RA', name: 'Rosario Aquino',      color: '#0b9b8a', cluster: 'Cluster 6', totalGroups: 1, activeMentees: 3, status: 'Active'   },
    { id: 'mhm23', initials: 'EE', name: 'Eduardo Esperanza',   color: '#e67700', cluster: 'Cluster 6', totalGroups: 1, activeMentees: 3, status: 'Active'   },
];

export interface MHPotentialMentee {
    id: string;
    initials: string;
    name: string;
    age: number;
    gender: string;
    cluster: string;
    coordinator: string;
    mentor: string;
    barangay: string;
    status: 'New' | 'Waiting for Assignment' | 'Assigned to Mentor' | 'Interview Scheduled' | 'Interview Completed' | 'Accepted';
    source: 'From C2S Group Finder' | 'Recommended';
    dateSubmitted: string;
}

export const MH_POTENTIAL_MENTEES: MHPotentialMentee[] = [
    { id: 'mhpm1',  initials: 'JR', name: 'Jasmine Reyes',       age: 22, gender: 'Female', cluster: 'Cluster 1', coordinator: 'Rosa Castillo',     mentor: 'Juan Dela Cruz',    barangay: 'Burol',              status: 'New',                    source: 'From C2S Group Finder', dateSubmitted: 'Jul 18, 2026' },
    { id: 'mhpm2',  initials: 'MS', name: 'Marco Santos',        age: 33, gender: 'Male',   cluster: 'Cluster 1', coordinator: 'Rosa Castillo',     mentor: '—',                  barangay: 'Paliparan III',      status: 'Waiting for Assignment', source: 'From C2S Group Finder', dateSubmitted: 'Jul 17, 2026' },
    { id: 'mhpm3',  initials: 'AM', name: 'Aira Mendoza',        age: 27, gender: 'Female', cluster: 'Cluster 1', coordinator: 'Ben Macaraeg',      mentor: 'Maria Reyes',        barangay: 'Sampaloc I',         status: 'Assigned to Mentor',     source: 'Recommended',           dateSubmitted: 'Jul 16, 2026' },
    { id: 'mhpm4',  initials: 'RB', name: 'Rafael Buenaventura', age: 29, gender: 'Male',   cluster: 'Cluster 1', coordinator: 'Sofia Aguila',      mentor: 'Juan Dela Cruz',     barangay: 'Burol',              status: 'Interview Scheduled',    source: 'From C2S Group Finder', dateSubmitted: 'Jul 15, 2026' },
    { id: 'mhpm5',  initials: 'NV', name: 'Nina Villanueva',     age: 24, gender: 'Female', cluster: 'Cluster 1', coordinator: 'Rosa Castillo',     mentor: 'Pedro Santos',       barangay: 'Paliparan III',      status: 'Interview Completed',    source: 'From C2S Group Finder', dateSubmitted: 'Jul 14, 2026' },
    { id: 'mhpm6',  initials: 'TO', name: 'Tirso Orozco',        age: 45, gender: 'Male',   cluster: 'Cluster 1', coordinator: 'Ben Macaraeg',      mentor: 'Lena Santos',        barangay: 'Salitran III',       status: 'Accepted',               source: 'Recommended',           dateSubmitted: 'Jul 12, 2026' },
    { id: 'mhpm7',  initials: 'BF', name: 'Bella Flores',        age: 19, gender: 'Female', cluster: 'Cluster 2', coordinator: 'Ben Macaraeg',      mentor: 'Ana Lim',            barangay: 'Emmanuel Bergado I', status: 'New',                    source: 'From C2S Group Finder', dateSubmitted: 'Jul 21, 2026' },
    { id: 'mhpm8',  initials: 'CR', name: 'Carlo Ramos',         age: 38, gender: 'Male',   cluster: 'Cluster 2', coordinator: 'Sofia Aguila',      mentor: '—',                  barangay: 'Fatima I',           status: 'Waiting for Assignment', source: 'From C2S Group Finder', dateSubmitted: 'Jul 20, 2026' },
    { id: 'mhpm9',  initials: 'PD', name: 'Pilar Domingo',       age: 31, gender: 'Female', cluster: 'Cluster 2', coordinator: 'Ben Macaraeg',      mentor: 'Carmen Villanueva',  barangay: 'Langkaan I',         status: 'Assigned to Mentor',     source: 'From C2S Group Finder', dateSubmitted: 'Jul 19, 2026' },
    { id: 'mhpm10', initials: 'EL', name: 'Eduardo Lim',         age: 40, gender: 'Male',   cluster: 'Cluster 3', coordinator: 'Sofia Aguila',      mentor: 'Ernesto Cruz',       barangay: 'San Jose',           status: 'Interview Scheduled',    source: 'Recommended',           dateSubmitted: 'Jul 22, 2026' },
    { id: 'mhpm11', initials: 'GL', name: 'Grace Luna',          age: 26, gender: 'Female', cluster: 'Cluster 3', coordinator: 'Sofia Aguila',      mentor: 'Luz Torres',         barangay: 'San Agustin I',      status: 'Interview Completed',    source: 'From C2S Group Finder', dateSubmitted: 'Jul 21, 2026' },
    { id: 'mhpm12', initials: 'VR', name: 'Vic Ramos',           age: 35, gender: 'Male',   cluster: 'Cluster 3', coordinator: 'Sofia Aguila',      mentor: 'Noel Flores',        barangay: 'San Andres I',       status: 'Accepted',               source: 'From C2S Group Finder', dateSubmitted: 'Jul 20, 2026' },
    { id: 'mhpm13', initials: 'AL', name: 'Agnes Lara',          age: 30, gender: 'Female', cluster: 'Cluster 4', coordinator: 'Patricia Bautista', mentor: 'Carlos Pineda',      barangay: 'Salawag',            status: 'New',                    source: 'From C2S Group Finder', dateSubmitted: 'Jul 23, 2026' },
    { id: 'mhpm14', initials: 'RN', name: 'Ronnie Navarro',      age: 42, gender: 'Male',   cluster: 'Cluster 4', coordinator: 'Patricia Bautista', mentor: '—',                  barangay: 'Sabang',             status: 'Waiting for Assignment', source: 'Recommended',           dateSubmitted: 'Jul 22, 2026' },
    { id: 'mhpm15', initials: 'LD', name: 'Lydia Dela Peña',     age: 36, gender: 'Female', cluster: 'Cluster 4', coordinator: 'Patricia Bautista', mentor: 'Fe Villarin',        barangay: 'Salitran I',         status: 'Assigned to Mentor',     source: 'From C2S Group Finder', dateSubmitted: 'Jul 21, 2026' },
    { id: 'mhpm16', initials: 'JP', name: 'Joel Padilla',        age: 28, gender: 'Male',   cluster: 'Cluster 4', coordinator: 'Patricia Bautista', mentor: 'Bobby Natividad',    barangay: 'Salitran II',        status: 'Interview Scheduled',    source: 'From C2S Group Finder', dateSubmitted: 'Jul 20, 2026' },
    { id: 'mhpm17', initials: 'MA', name: 'Mila Aguilar',        age: 25, gender: 'Female', cluster: 'Cluster 5', coordinator: 'Ferdinand Ramos',   mentor: 'Tomas Castillo',     barangay: 'Langkaan II',        status: 'New',                    source: 'From C2S Group Finder', dateSubmitted: 'Jul 24, 2026' },
    { id: 'mhpm18', initials: 'EO', name: 'Edwin Ocampo',        age: 37, gender: 'Male',   cluster: 'Cluster 5', coordinator: 'Ferdinand Ramos',   mentor: 'Rowena Ignacio',     barangay: 'Paliparan I',        status: 'Interview Completed',    source: 'Recommended',           dateSubmitted: 'Jul 23, 2026' },
    { id: 'mhpm19', initials: 'RF', name: 'Rosalie Flores',      age: 29, gender: 'Female', cluster: 'Cluster 5', coordinator: 'Ferdinand Ramos',   mentor: 'Victor Bernardo',    barangay: 'Paliparan II',       status: 'Accepted',               source: 'From C2S Group Finder', dateSubmitted: 'Jul 22, 2026' },
    { id: 'mhpm20', initials: 'AB', name: 'Arnel Bello',         age: 44, gender: 'Male',   cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Helen Macapagal',    barangay: 'Sampaloc II',        status: 'New',                    source: 'From C2S Group Finder', dateSubmitted: 'Jul 25, 2026' },
    { id: 'mhpm21', initials: 'TC', name: 'Teresita Corpuz',     age: 50, gender: 'Female', cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: '—',                  barangay: 'Sampaloc III',       status: 'Waiting for Assignment', source: 'Recommended',           dateSubmitted: 'Jul 24, 2026' },
    { id: 'mhpm22', initials: 'PN', name: 'Paolo Neri',          age: 23, gender: 'Male',   cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Joel Panganiban',    barangay: 'Sampaloc IV',        status: 'Assigned to Mentor',     source: 'From C2S Group Finder', dateSubmitted: 'Jul 23, 2026' },
    { id: 'mhpm23', initials: 'GS', name: 'Gina Soriano',        age: 33, gender: 'Female', cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Rosario Aquino',     barangay: 'San Agustin II',     status: 'Interview Scheduled',    source: 'From C2S Group Finder', dateSubmitted: 'Jul 22, 2026' },
    { id: 'mhpm24', initials: 'KM', name: 'Kevin Maglalang',     age: 27, gender: 'Male',   cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Eduardo Esperanza',  barangay: 'Sampaloc II',        status: 'Interview Completed',    source: 'Recommended',           dateSubmitted: 'Jul 21, 2026' },
];

export interface MHActiveMentee {
    id: string;
    initials: string;
    name: string;
    cluster: string;
    coordinator: string;
    mentor: string;
    barangay: string;
    module: string;
    progress: number;
}

export const MH_ACTIVE_MENTEES_LIST: MHActiveMentee[] = [
    { id: 'mham1',  initials: 'AC', name: 'Anna Cruz',        cluster: 'Cluster 1', coordinator: 'Rosa Castillo',     mentor: 'Juan Dela Cruz',    barangay: 'Burol',              module: 'Module 2', progress: 35 },
    { id: 'mham2',  initials: 'JT', name: 'Joseph Tan',       cluster: 'Cluster 1', coordinator: 'Rosa Castillo',     mentor: 'Pedro Santos',       barangay: 'Paliparan III',      module: 'Module 2', progress: 25 },
    { id: 'mham3',  initials: 'ML', name: 'Maria Lopez',      cluster: 'Cluster 1', coordinator: 'Ben Macaraeg',      mentor: 'Maria Reyes',        barangay: 'Sampaloc I',         module: 'Module 1', progress: 15 },
    { id: 'mham4',  initials: 'DP', name: 'Daniel Park',      cluster: 'Cluster 1', coordinator: 'Rosa Castillo',     mentor: 'Juan Dela Cruz',     barangay: 'Burol',              module: 'Module 2', progress: 35 },
    { id: 'mham5',  initials: 'LG', name: 'Liza Garcia',      cluster: 'Cluster 1', coordinator: 'Rosa Castillo',     mentor: 'Pedro Santos',       barangay: 'Paliparan III',      module: 'Module 1', progress: 10 },
    { id: 'mham6',  initials: 'EF', name: 'Elena Fuentes',    cluster: 'Cluster 1', coordinator: 'Ben Macaraeg',      mentor: 'Lena Santos',        barangay: 'Salitran III',       module: 'Module 1', progress: 5  },
    { id: 'mham7',  initials: 'RB', name: 'Rachel Bautista',  cluster: 'Cluster 2', coordinator: 'Ben Macaraeg',      mentor: 'Ana Lim',            barangay: 'Emmanuel Bergado I', module: 'Module 2', progress: 35 },
    { id: 'mham8',  initials: 'DR', name: 'Daniel Reyes',     cluster: 'Cluster 2', coordinator: 'Sofia Aguila',      mentor: 'Carmen Villanueva',  barangay: 'Fatima I',           module: 'Module 2', progress: 35 },
    { id: 'mham9',  initials: 'KA', name: 'Karen Aquino',     cluster: 'Cluster 2', coordinator: 'Ben Macaraeg',      mentor: 'Rico Bautista',      barangay: 'Langkaan I',         module: 'Module 1', progress: 20 },
    { id: 'mham10', initials: 'PL', name: 'Paulo Lim',        cluster: 'Cluster 2', coordinator: 'Ben Macaraeg',      mentor: 'Ana Lim',            barangay: 'Emmanuel Bergado I', module: 'Module 3', progress: 55 },
    { id: 'mham11', initials: 'SC', name: 'Sofia Cruz',       cluster: 'Cluster 3', coordinator: 'Sofia Aguila',      mentor: 'Ernesto Cruz',       barangay: 'San Jose',           module: 'Module 2', progress: 40 },
    { id: 'mham12', initials: 'MV', name: 'Miguel Vega',      cluster: 'Cluster 3', coordinator: 'Sofia Aguila',      mentor: 'Luz Torres',         barangay: 'San Agustin I',      module: 'Module 1', progress: 10 },
    { id: 'mham13', initials: 'IN', name: 'Iris Navarro',     cluster: 'Cluster 3', coordinator: 'Sofia Aguila',      mentor: 'Noel Flores',        barangay: 'San Andres I',       module: 'Module 3', progress: 60 },
    { id: 'mham14', initials: 'BT', name: 'Ben Torres',       cluster: 'Cluster 3', coordinator: 'Sofia Aguila',      mentor: 'Alma Mendoza',       barangay: 'Victoria Reyes',     module: 'Module 2', progress: 30 },
    { id: 'mham15', initials: 'FP', name: 'Felisa Puno',      cluster: 'Cluster 4', coordinator: 'Patricia Bautista', mentor: 'Carlos Pineda',      barangay: 'Salawag',            module: 'Module 2', progress: 40 },
    { id: 'mham16', initials: 'GB', name: 'Gilbert Basco',    cluster: 'Cluster 4', coordinator: 'Patricia Bautista', mentor: 'Fe Villarin',        barangay: 'Sabang',             module: 'Module 1', progress: 20 },
    { id: 'mham17', initials: 'OC', name: 'Olivia Castro',    cluster: 'Cluster 4', coordinator: 'Patricia Bautista', mentor: 'Bobby Natividad',    barangay: 'Salitran I',         module: 'Module 2', progress: 30 },
    { id: 'mham18', initials: 'WD', name: 'Willy Dizon',      cluster: 'Cluster 5', coordinator: 'Ferdinand Ramos',   mentor: 'Tomas Castillo',     barangay: 'Langkaan II',        module: 'Module 1', progress: 15 },
    { id: 'mham19', initials: 'CE', name: 'Celia Estrada',    cluster: 'Cluster 5', coordinator: 'Ferdinand Ramos',   mentor: 'Rowena Ignacio',     barangay: 'Paliparan I',        module: 'Module 2', progress: 45 },
    { id: 'mham20', initials: 'TF', name: 'Teodoro Fontanilla', cluster: 'Cluster 5', coordinator: 'Ferdinand Ramos', mentor: 'Victor Bernardo',   barangay: 'Paliparan II',       module: 'Module 1', progress: 10 },
    { id: 'mham21', initials: 'NG', name: 'Nilda Guerrero',   cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Helen Macapagal',    barangay: 'Sampaloc II',        module: 'Module 3', progress: 65 },
    { id: 'mham22', initials: 'IH', name: 'Isidro Hernandez', cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Joel Panganiban',    barangay: 'Sampaloc III',       module: 'Module 2', progress: 35 },
    { id: 'mham23', initials: 'LI', name: 'Leonora Ibarra',   cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Rosario Aquino',     barangay: 'Sampaloc IV',        module: 'Module 1', progress: 20 },
    { id: 'mham24', initials: 'PJ', name: 'Pacita Jimenez',   cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Eduardo Esperanza',  barangay: 'San Agustin II',     module: 'Module 2', progress: 50 },
    { id: 'mham25', initials: 'QK', name: 'Quirino Kalaw',    cluster: 'Cluster 6', coordinator: 'Maricel Santos',    mentor: 'Helen Macapagal',    barangay: 'Sampaloc II',        module: 'Module 1', progress: 5  },
];

export const MH_NOTIFICATIONS = [
    { id: 'mhn1', type: 'worker'      as const, text: 'New Worker: Pilar Domingo added to Cluster 2',              time: '1 hr ago',   read: false },
    { id: 'mhn2', type: 'worker_id'   as const, text: 'Pending Worker ID Approval: Rico Bautista (Cluster 2)',      time: '2 hrs ago',  read: false },
    { id: 'mhn3', type: 'coordinator' as const, text: 'Coordinator Update: Sofia Aguila completed 5 interviews',    time: '4 hrs ago',  read: false },
    { id: 'mhn4', type: 'mentor'      as const, text: 'Mentor Update: Juan Dela Cruz accepted new mentee request',  time: '6 hrs ago',  read: true  },
    { id: 'mhn5', type: 'worker_id'   as const, text: 'Pending Worker ID Approval: Elena Fuentes (Cluster 3)',      time: 'Yesterday',  read: true  },
    { id: 'mhn6', type: 'coordinator' as const, text: 'Coordinator Update: Rosa Castillo assigned 2 new mentees',   time: 'Yesterday',  read: true  },
    { id: 'mhn7', type: 'mentor'      as const, text: 'Mentor Update: Maria Reyes reported 3 active mentees',       time: '2 days ago', read: true  },
    { id: 'mhn8', type: 'worker'      as const, text: 'New Worker: Carlo Ramos added to Cluster 2',                 time: '2 days ago', read: true  },
    { id: 'mhn9', type: 'coordinator' as const, text: 'Coordinator Update: Patricia Bautista joined Cluster 4',     time: '3 days ago', read: true  },
    { id: 'mhn10', type: 'worker'     as const, text: 'New Worker: Mila Aguilar added to Cluster 5',                time: '3 days ago', read: true  },
    { id: 'mhn11', type: 'coordinator' as const, text: 'Coordinator Update: Maricel Santos assigned 4 new mentees', time: '4 days ago', read: true  },
];
