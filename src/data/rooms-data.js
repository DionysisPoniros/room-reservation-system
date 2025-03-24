// src/data/rooms-data.js
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Complete room data for Max Lowenthal Hall and Wallace Library
export const ritRooms = [
  // Max Lowenthal Hall Rooms
  {
    name: "LOW-1060 Bruce May Room",
    type: "Team Room",
    capacity: 2,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "1",
    available: true,
    description: "Small team room suitable for meetings of 1-2 people."
  },
  {
    name: "LOW-1064 Howard C. Green Room",
    type: "Team Room",
    capacity: 2,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "1",
    available: true,
    description: "Small team room suitable for meetings of 1-2 people."
  },
  {
    name: "LOW-1100 Study Lounge",
    type: "Lounge",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Comfortable Seating"],
    floor: "1",
    available: true,
    description: "Open study space with comfortable seating for individual or group work."
  },
  {
    name: "LOW-1105/1110 PhilipTyler Active Learning Classroom",
    type: "Classroom",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Smart Board", "Whiteboard", "Projector", "Computers", "Video Conference"],
    floor: "1",
    available: true,
    description: "Active learning classroom with modern technology for interactive teaching."
  },
  {
    name: "LOW-1115/1120 REDCOM Active Learning Collaboratory",
    type: "Classroom",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Smart Board", "Whiteboard", "Projector", "Computers", "Video Conference"],
    floor: "1",
    available: true,
    description: "Collaborative learning space with flexible furniture and integrated technology."
  },
  {
    name: "LOW-1125 Sklarsky Center for Business Analytics",
    type: "Lab",
    capacity: 16,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Computers", "Whiteboard", "Data Analysis Software", "TV Screen"],
    floor: "1",
    available: true,
    description: "Specialized lab for business analytics with advanced data processing capabilities."
  },
  {
    name: "LOW-1135 Lecture Hall",
    type: "Lecture Hall",
    capacity: 60,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Audio System", "Whiteboard"],
    floor: "1",
    available: true,
    description: "Medium-sized lecture hall with tiered seating for optimal viewing."
  },
  {
    name: "LOW-1215 Joseph M. Lobozzo Executive MBA Room",
    type: "Classroom",
    capacity: 41,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Whiteboard", "Audio System", "Video Conference"],
    floor: "1",
    available: true,
    description: "Classroom designed for executive education with premium amenities."
  },
  {
    name: "LOW-1225 Dan D. Tessoni Business Center",
    type: "Meeting Room",
    capacity: 24,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["TV Screen", "Whiteboard", "Video Conference"],
    floor: "1",
    available: true,
    description: "Business center for meetings and collaborative work."
  },
  {
    name: "LOW-1235 Dan D. Tessoni Business Center",
    type: "Meeting Room",
    capacity: 24,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["TV Screen", "Whiteboard", "Video Conference"],
    floor: "1",
    available: true,
    description: "Business center for meetings and collaborative work."
  },
  {
    name: "LOW-1245 Global Business Solutions Lab",
    type: "Lab",
    capacity: 30,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Computers", "Whiteboard", "Projector", "Global Business Software"],
    floor: "1",
    available: true,
    description: "Lab equipped for global business simulations and international projects."
  },
  {
    name: "LOW-1050 Gueldenpfennig Auditorium",
    type: "Auditorium",
    capacity: 138,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Audio System", "Microphones", "Recording Equipment"],
    floor: "1",
    available: true,
    description: "Large auditorium for lectures, events, and presentations with professional AV."
  },
  {
    name: "LOW-1910 Zutes Atrium",
    type: "Atrium",
    capacity: 40,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "1",
    available: true,
    description: "Open atrium space suitable for gatherings and events."
  },
  {
    name: "LOW-1912 Palmers Atrium",
    type: "Atrium",
    capacity: 40,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "1",
    available: true,
    description: "Open atrium space with natural light for gatherings and events."
  },
  {
    name: "LOW-1231 Multi-Purpose Room Kitchen",
    type: "Meeting Room",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Kitchen Equipment", "Tables", "Chairs"],
    floor: "1",
    available: true,
    description: "Multi-purpose space with kitchen facilities for events and gatherings."
  },
  {
    name: "LOW-1912 Vanden Brul Entrepreneurship Way",
    type: "Meeting Room",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor 1",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Tables", "Chairs"],
    floor: "1",
    available: true,
    description: "Space dedicated to entrepreneurship activities and innovation."
  },
  {
    name: "LOW-2312 EMBA Conference Room",
    type: "Conference Room",
    capacity: 12,
    location: "Max Lowenthal Hall, Floor 2",
    building: "Max Lowenthal Hall",
    equipment: ["TV Screen", "Video Conference", "Whiteboard"],
    floor: "2",
    available: true,
    description: "Executive conference room with premium amenities."
  },
  {
    name: "LOW-3000 Ricotta Dean's Conference Room",
    type: "Conference Room",
    capacity: 12,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["TV Screen", "Video Conference", "Whiteboard"],
    floor: "3",
    available: true,
    description: "Premium conference room adjacent to dean's office."
  },
  {
    name: "LOW-3010 Vogel Integrated Business Technology Lab",
    type: "Lab",
    capacity: 16,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Computers", "Business Software", "Whiteboard"],
    floor: "3",
    available: true,
    description: "Technology lab for business applications and software training."
  },
  {
    name: "LOW-3015 Hinkston Business Case Analysis Lab",
    type: "Lab",
    capacity: 30,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Computers", "Business Software", "Whiteboard", "Case Analysis Tools"],
    floor: "3",
    available: true,
    description: "Specialized lab for business case analysis and problem-solving."
  },
  {
    name: "LOW-3025 Krupnicki Board Room",
    type: "Board Room",
    capacity: 24,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Large Conference Table", "Video Conference", "TV Screen", "Whiteboard"],
    floor: "3",
    available: true,
    description: "Formal board room for important meetings and executive discussions."
  },
  {
    name: "LOW-3040 Jesse Redlo Business Case Analysis Lab",
    type: "Lab",
    capacity: 18,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Computers", "Business Software", "Whiteboard", "Case Analysis Tools"],
    floor: "3",
    available: true,
    description: "Specialized lab for business case analysis with collaborative workstations."
  },
  {
    name: "LOW-3050 Behavioral Research Lab Reception Area",
    type: "Lab",
    capacity: 1,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Desk", "Chair"],
    floor: "3",
    available: true,
    description: "Reception area for the Behavioral Research Lab."
  },
  {
    name: "LOW-3052 Behavioral Research Lab",
    type: "Lab",
    capacity: 15,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Research Equipment", "Computers", "Recording Equipment"],
    floor: "3",
    available: true,
    description: "Research lab for behavioral studies and business psychology experiments."
  },
  {
    name: "LOW-3055 Behavioral Research Lab, Breakout Room",
    type: "Lab",
    capacity: 8,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Research Equipment", "Recording Equipment"],
    floor: "3",
    available: true,
    description: "Breakout room for the Behavioral Research Lab."
  },
  {
    name: "LOW-3057 Behavioral Research Lab, Control Room",
    type: "Lab",
    capacity: 4,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Research Equipment", "Recording Equipment", "Computers"],
    floor: "3",
    available: true,
    description: "Control room for the Behavioral Research Lab."
  },
  {
    name: "LOW-3059 Behavioral Research Lab, Breakout Room",
    type: "Lab",
    capacity: 4,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Research Equipment", "Recording Equipment"],
    floor: "3",
    available: true,
    description: "Breakout room for the Behavioral Research Lab."
  },
  {
    name: "LOW-3060 Large Team Room",
    type: "Team Room",
    capacity: 6,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "3",
    available: true,
    description: "Team room for small group work and meetings."
  },
  {
    name: "LOW-3062 Break Out Room",
    type: "Team Room",
    capacity: 4,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard"],
    floor: "3",
    available: true,
    description: "Small breakout room for team discussions."
  },
  {
    name: "LOW-3105 Classroom",
    type: "Classroom",
    capacity: 44,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "LOW-3115 Classroom",
    type: "Classroom",
    capacity: 40,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "LOW-3120 Gelsomino Family Student Learning Center",
    type: "Lab",
    capacity: 10,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Computers", "Whiteboard", "Learning Software"],
    floor: "3",
    available: true,
    description: "Specialized learning center with educational technology and support resources."
  },
  {
    name: "LOW-3135 Business Enterprise Systems (BEST) Lab",
    type: "Lab",
    capacity: 36,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Computers", "Enterprise Software", "Whiteboard", "Business Simulation Tools"],
    floor: "3",
    available: true,
    description: "Lab for enterprise systems training and business simulations."
  },
  {
    name: "LOW-3215 Lecture Hall",
    type: "Lecture Hall",
    capacity: 106,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Audio System", "Whiteboard", "Lecture Capture"],
    floor: "3",
    available: true,
    description: "Large lecture hall with tiered seating and comprehensive AV capabilities."
  },
  {
    name: "LOW-3225 Classroom",
    type: "Classroom",
    capacity: 49,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom designed for flexible teaching methods."
  },
  {
    name: "LOW-3235 Classroom",
    type: "Classroom",
    capacity: 49,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom designed for flexible teaching methods."
  },
  {
    name: "LOW-3245 Classroom",
    type: "Classroom",
    capacity: 47,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom designed for flexible teaching methods."
  },
  {
    name: "LOW-3910 Third Floor Balcony",
    type: "Meeting Room",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor 3",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "3",
    available: true,
    description: "Open balcony space for informal gatherings and meetings."
  },
  {
    name: "LOW-4050 Susan R. Holliday Center",
    type: "Meeting Room",
    capacity: 120,
    location: "Max Lowenthal Hall, Floor 4",
    building: "Max Lowenthal Hall",
    equipment: ["Projector", "Audio System", "Video Conference"],
    floor: "4",
    available: true,
    description: "Large multipurpose room for events and gatherings."
  },
  {
    name: "LOW-4950 Susan R. Holliday Center Atrium",
    type: "Atrium",
    capacity: 150,
    location: "Max Lowenthal Hall, Floor 4",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "4",
    available: true,
    description: "Spacious atrium for large gatherings and events."
  },
  {
    name: "LOW-A071 John Morrison Team Room",
    type: "Team Room",
    capacity: 4,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Table", "Chairs"],
    floor: "A",
    available: true,
    description: "Team room for small group collaboration."
  },
  {
    name: "LOW-A073 Newell Walters Family Team Room",
    type: "Team Room",
    capacity: 4,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Table", "Chairs"],
    floor: "A",
    available: true,
    description: "Team room for small group collaboration."
  },
  {
    name: "LOW-A075 Gary S. Schwingel Team Room",
    type: "Team Room",
    capacity: 4,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Table", "Chairs"],
    floor: "A",
    available: true,
    description: "Team room for small group collaboration."
  },
  {
    name: "LOW-A076 Kozel and Schwertz Team Room",
    type: "Team Room",
    capacity: 6,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Table", "Chairs"],
    floor: "A",
    available: true,
    description: "Larger team room for small group collaboration."
  },
  {
    name: "LOW-A077 Terry Doherty Team Room",
    type: "Team Room",
    capacity: 4,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Table", "Chairs"],
    floor: "A",
    available: true,
    description: "Team room for small group collaboration."
  },
  {
    name: "LOW-A078 Ted and Katherine Martinez Team Room",
    type: "Team Room",
    capacity: 6,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Table", "Chairs"],
    floor: "A",
    available: true,
    description: "Larger team room for small group collaboration."
  },
  {
    name: "LOW-A079 c3Controls Team Room",
    type: "Team Room",
    capacity: 4,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: ["Whiteboard", "Table", "Chairs"],
    floor: "A",
    available: true,
    description: "Team room for small group collaboration."
  },
  {
    name: "LOW-A080 McCue Family Atrium",
    type: "Atrium",
    capacity: 14,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "A",
    available: true,
    description: "Small atrium area for gatherings."
  },
  {
    name: "LOW-A913 Joseph P. Turo '76 Commons",
    type: "Meeting Room",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "A",
    available: true,
    description: "Commons area for informal meetings and gatherings."
  },
  {
    name: "LOW-A913 Levine Commons",
    type: "Meeting Room",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "A",
    available: true,
    description: "Commons area for informal meetings and gatherings."
  },
  {
    name: "LOW-A950 Hope and Lance Drummond Lounge",
    type: "Lounge",
    capacity: 25,
    location: "Max Lowenthal Hall, Floor A",
    building: "Max Lowenthal Hall",
    equipment: ["Comfortable Seating"],
    floor: "A",
    available: true,
    description: "Comfortable lounge area for informal gatherings and relaxation."
  },
  {
    name: "LOW-Walter Muench Patio",
    type: "Outdoor Space",
    capacity: 20,
    location: "Max Lowenthal Hall, Outdoor",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "1",
    available: true,
    description: "Outdoor patio space for gatherings when weather permits."
  },
  {
    name: "LOW-Wentworth Terrace (North Patio)",
    type: "Outdoor Space",
    capacity: 20,
    location: "Max Lowenthal Hall, Outdoor",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "1",
    available: true,
    description: "North-facing patio terrace for outdoor gatherings."
  },
  {
    name: "LOW-South Roof Patio",
    type: "Outdoor Space",
    capacity: 20,
    location: "Max Lowenthal Hall, Outdoor",
    building: "Max Lowenthal Hall",
    equipment: [],
    floor: "4",
    available: true,
    description: "Rooftop patio with views of campus."
  },
  
  // Wallace Library Rooms
  {
    name: "WAL-1545 Group Study Room",
    type: "Group Study Room",
    capacity: 6,
    location: "Wallace Library, Floor 1",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "1",
    available: true,
    description: "Collaborative study space for small groups."
  },
  {
    name: "WAL-1624 Circulation Lobby",
    type: "Lounge",
    capacity: 100,
    location: "Wallace Library, Floor 1",
    building: "Wallace Library",
    equipment: [],
    floor: "1",
    available: true,
    description: "Main lobby area with casual seating and information desk."
  },
  {
    name: "WAL-2470 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 2",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "2",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-2472 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 2",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "2",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-2474 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 2",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "2",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-2476 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 2",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "2",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-2478 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 2",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "2",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-2480 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 2",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "2",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-3420 Classroom",
    type: "Classroom",
    capacity: 48,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom for lectures and group instruction."
  },
  {
    name: "WAL-3430 Classroom",
    type: "Classroom",
    capacity: 60,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Larger classroom with modern educational technology."
  },
  {
    name: "WAL-3440 Classroom",
    type: "Classroom",
    capacity: 48,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom for lectures and group instruction."
  },
  {
    name: "WAL-3470 Group Study Room",
    type: "Group Study Room",
    capacity: 6,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "3",
    available: true,
    description: "Collaborative study space for small groups."
  },
  {
    name: "WAL-3472 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "3",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-3474 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "3",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-3476 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "3",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-3478 Group Study Room",
    type: "Group Study Room",
    capacity: 6,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "3",
    available: true,
    description: "Collaborative study space for small groups."
  },
  {
    name: "WAL-3484 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "3",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-3486 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "3",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-3488 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "3",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-3490 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-3505-A Collaboration Lounge",
    type: "Lounge",
    capacity: 50,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Comfortable Seating", "Power Outlets"],
    floor: "3",
    available: true,
    description: "Open collaboration space with casual seating arrangements."
  },
  {
    name: "WAL-3510 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-3520 Classroom",
    type: "Classroom",
    capacity: 32,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-3530 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-3553 Group Study Room",
    type: "Group Study Room",
    capacity: 4,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "3",
    available: true,
    description: "Smaller group study room for collaborative work."
  },
  {
    name: "WAL-3560 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-3605 Classroom",
    type: "Classroom",
    capacity: 30,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Smaller classroom ideal for seminars and discussion-based classes."
  },
  {
    name: "WAL-3610 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "3",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-3657 Group Study Room",
    type: "Group Study Room",
    capacity: 6,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "3",
    available: true,
    description: "Collaborative study space for small groups."
  },
  {
    name: "WAL-3659 Group Study Room",
    type: "Group Study Room",
    capacity: 6,
    location: "Wallace Library, Floor 3",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "3",
    available: true,
    description: "Collaborative study space for small groups."
  },
  {
    name: "WAL-4480 Classroom",
    type: "Classroom",
    capacity: 48,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "4",
    available: true,
    description: "Standard classroom for lectures and group instruction."
  },
  {
    name: "WAL-4510 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "4",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-4520 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "4",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-4530 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "4",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-4560 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "4",
    available: true,
    description: "Standard classroom with modern educational technology."
  },
  {
    name: "WAL-4600 Classroom",
    type: "Classroom",
    capacity: 40,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "4",
    available: true,
    description: "Larger classroom with flexible seating arrangements."
  },
  {
    name: "WAL-4620 Classroom",
    type: "Classroom",
    capacity: 40,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "4",
    available: true,
    description: "Larger classroom with flexible seating arrangements."
  },
  {
    name: "WAL-4640 Classroom",
    type: "Classroom",
    capacity: 40,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "4",
    available: true,
    description: "Larger classroom with flexible seating arrangements."
  },
  {
    name: "WAL-4670 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4672 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4674 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4675 Group Study Room",
    type: "Group Study Room",
    capacity: 6,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "4",
    available: true,
    description: "Collaborative study space for small groups."
  },
  {
    name: "WAL-4686 Group Study Room",
    type: "Group Study Room",
    capacity: 6,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "4",
    available: true,
    description: "Collaborative study space for small groups."
  },
  {
    name: "WAL-4688 Group Study Room",
    type: "Group Study Room",
    capacity: 6,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Whiteboard", "TV Screen"],
    floor: "4",
    available: true,
    description: "Collaborative study space for small groups."
  },
  {
    name: "WAL-4901 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4902 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4903 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4904 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4905 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4906 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4907 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-4908 Ind Study Room",
    type: "Individual Study Room",
    capacity: 1,
    location: "Wallace Library, Floor 4",
    building: "Wallace Library",
    equipment: ["Desk", "Chair"],
    floor: "4",
    available: true,
    description: "Private study room for individual quiet work."
  },
  {
    name: "WAL-A400 Classroom",
    type: "Classroom",
    capacity: 26,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "A",
    available: true,
    description: "Smaller classroom in basement level with good acoustics."
  },
  {
    name: "WAL-A410 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "A",
    available: true,
    description: "Standard classroom in basement level with modern technology."
  },
  {
    name: "WAL-A420 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "A",
    available: true,
    description: "Standard classroom in basement level with modern technology."
  },
  {
    name: "WAL-A430 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "A",
    available: true,
    description: "Standard classroom in basement level with modern technology."
  },
  {
    name: "WAL-A440 Classroom",
    type: "Classroom",
    capacity: 36,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Projector", "Whiteboard", "Audio System"],
    floor: "A",
    available: true,
    description: "Standard classroom in basement level with modern technology."
  },
  {
    name: "WAL-A600 CTL Faculty Learning Commons",
    type: "Lounge",
    capacity: 32,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Computers", "Whiteboard", "Video Conference"],
    floor: "A",
    available: true,
    description: "Faculty development space with resources for teaching improvement."
  },
  {
    name: "WAL-A674 CTL Consultation Room",
    type: "Meeting Room",
    capacity: 4,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Table", "Chairs", "Whiteboard"],
    floor: "A",
    available: true,
    description: "Small consultation room for faculty development meetings."
  },
  {
    name: "WAL-A675 CTL Golia Conference Room",
    type: "Conference Room",
    capacity: 10,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Video Conference", "TV Screen", "Whiteboard"],
    floor: "A",
    available: true,
    description: "Conference room for faculty meetings and professional development."
  },
  {
    name: "WAL-A677 CTL Studio",
    type: "Meeting Room",
    capacity: 2,
    location: "Wallace Library, Floor A",
    building: "Wallace Library",
    equipment: ["Recording Equipment", "Computer"],
    floor: "A",
    available: true,
    description: "Small studio space for media creation and recording."
  }
];

// Function to populate Firebase with the room data
export const populateRoomsInFirebase = async () => {
  try {
    console.log("Starting to populate rooms in Firebase...");
    
    // Use a batch write for better performance and atomicity
    const batch = writeBatch(db);
    let count = 0;
    
    // Add each room to the batch
    ritRooms.forEach((room) => {
      const roomRef = doc(collection(db, 'rooms'));
      batch.set(roomRef, {
        ...room,
        createdAt: new Date()
      });
      count++;
    });
    
    // Commit the batch
    await batch.commit();
    console.log(`Successfully added ${count} rooms to Firebase!`);
    
    return { success: true, count };
  } catch (error) {
    console.error("Error populating rooms:", error);
    return { success: false, error: error.message };
  }
};

// Function to add a single room (for testing)
export const addSingleRoom = async (room) => {
  try {
    const roomRef = await addDoc(collection(db, 'rooms'), {
      ...room,
      createdAt: new Date()
    });
    console.log(`Added room with ID: ${roomRef.id}`);
    return { success: true, id: roomRef.id };
  } catch (error) {
    console.error("Error adding room:", error);
    return { success: false, error: error.message };
  }
};

// Example usage:
// import { populateRoomsInFirebase } from './data/rooms-data';
// populateRoomsInFirebase().then(result => console.log(result));