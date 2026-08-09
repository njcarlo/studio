// ─── C2S shared types and static reference data ──────────────────────────────
//
// Entity data (groups, mentees, mentors, clusters, the potential-mentee
// pipeline) is NOT here — it comes from the database through @studio/c2s via
// the server actions in src/actions and is passed into components as props.
// What remains below is the type surface those props are shaped to, plus
// genuinely static reference data (barangays, tag colors, service times).

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

/** Chip styling per demographic tag. `tagColor` falls back to teal for unknown tags. */
export const TAG_COLORS: Record<string, string> = {
    'Young Adults': TEAL,
    'Single Only': PINK,
    'Teens': GREEN,
    'Adults': PINK,
    'Couples: Married': TEAL,
    'Couples: Married with Kids': PINK,
    'College Students': TEAL,
    'Men Only': BLUE,
    'Women': PURPLE,
    'Family': PURPLE,
    'New': YELLOW,
};

export function tagColor(label: string): string {
    return TAG_COLORS[label] ?? TEAL;
}

export const ALL_TAGS: string[] = [
    'Young Adults', 'Single Only', 'Teens', 'Adults',
    'Couples: Married', 'Couples: Married with Kids',
    'College Students', 'Men Only', 'Women', 'Family', 'New',
];

/** An activity-feed item on the cluster-head, coordinator and ministry-head dashboards. */
export interface DashboardNotification {
    id: string;
    type: string;
    text: string;
    time: string;
    read: boolean;
}

/** A group row on the cluster-head map/list (CH_CLUSTER_GROUPS shape). */
export interface ClusterGroupPin {
    id: string;
    name: string;
    type: 'Community-based' | 'Church-based';
    barangay: string;
    mentor: string;
    members: number;
    lat: number;
    lng: number;
}


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


export const MEETUP_DAYS = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


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


export const AGE_GROUPS = ['All', 'Teens', 'College Students', 'Young Adults', 'Adults'];


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


export interface ClusterMentorGroup {
    name: string;
    barangay: string;
    mentees: number;
    schedule?: string;
    address?: string;
}

export interface ClusterMentorMentee {
    id: string;
    initials: string;
    name: string;
    color: string;
    group: string;
    barangay: string;
    lesson: string;
    devotionDate: string;
    attendanceDate: string;
    status: 'Active' | 'Inactive' | 'Needs Follow-up';
}

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
    groups: ClusterMentorGroup[];
    mentees: ClusterMentorMentee[];
}


export interface ClusterPotentialMentee extends PotentialMentee {
    clusterStatus: 'New' | 'Waiting for Assignment' | 'Assigned to Mentor' | 'Interview Scheduled' | 'Interview Completed' | 'Accepted';
    assignedCoordinator?: string;
    interviewDate?: string;
}


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


export interface MHMentor {
    id: string;
    initials: string;
    name: string;
    color: string;
    cluster: string;
    totalGroups: number;
    activeMentees: number;
    status: 'Active' | 'Inactive';
    phone: string;
    dateAssigned: string;
}


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

