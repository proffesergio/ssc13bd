/** Synthetic preview data. Never written to the database or used for authentication. */
export const demoMembers = [
  { id: "demo-member-1", name: "Dr. Nadia Rahman", image: null, district: "Dhaka", profession: "Doctor", organization: "Community health volunteer", bio: "Here for our batch, one conversation at a time.", bloodGroup: "B+", batchVerified: true },
  { id: "demo-member-2", name: "Tanvir Hasan", image: null, district: "Chattogram", profession: "Corporate", organization: "Product & technology", bio: "Happy to help with career advice and connections.", bloodGroup: "O+", batchVerified: true },
  { id: "demo-member-3", name: "Farhana Islam", image: null, district: "Dhaka", profession: "Lawyer", organization: "Legal services", bio: "Making legal guidance a little more accessible.", bloodGroup: "A+", batchVerified: true },
  { id: "demo-member-4", name: "Rakib Ahmed", image: null, district: "Sylhet", profession: "Government", organization: "Public service", bio: "Connected by 2013. Committed to community.", bloodGroup: "AB+", batchVerified: true },
  { id: "demo-member-5", name: "Samiul Karim", image: null, district: "Rajshahi", profession: "Police", organization: "Community support", bio: "Helping batchmates find the right support.", bloodGroup: "O-", batchVerified: true },
  { id: "demo-member-6", name: "Ayesha Siddiqua", image: null, district: "Cumilla", profession: "Army", organization: "Service & leadership", bio: "Stronger together, wherever life takes us.", bloodGroup: "B-", batchVerified: true },
];
export const demoSosPosts = [
  { id: "demo-sos-1", title: "B+ blood donor needed in Dhaka", description: "Illustrative request: a batchmate needs a B+ donor near Dhanmondi. This is sample content, not an active emergency.", category: "Blood", district: "Dhaka", targetProfession: "Doctor", urgency: "urgent", status: "OPEN", createdAt: "2026-11-06T06:00:00.000Z", author: { id: demoMembers[0].id, name: demoMembers[0].name, image: null } },
  { id: "demo-sos-2", title: "Looking for a legal consultation", description: "Illustrative request: seeking guidance on a tenancy agreement from a lawyer in our batch. This is sample content.", category: "Legal", district: "Dhaka", targetProfession: "Lawyer", urgency: "normal", status: "OPEN", createdAt: "2026-11-05T08:00:00.000Z", author: { id: demoMembers[1].id, name: demoMembers[1].name, image: null } },
];
export const demoEvents = [
  { id: "demo-event-1", title: "Dhaka batchmates' reunion", description: "An illustrative gathering to reconnect, share stories and make new memories with the class of 2013.", location: "Dhanmondi, Dhaka", district: "Dhaka", startsAt: "2026-12-18T10:00:00.000Z", capacity: 150, category: "Reunion", image: null, attendeeCount: 42, isAttending: false },
  { id: "demo-event-2", title: "Career conversations over coffee", description: "Sample event: an informal afternoon of career advice and conversations across professions.", location: "GEC Circle, Chattogram", district: "Chattogram", startsAt: "2026-12-25T09:00:00.000Z", capacity: 40, category: "Meetup", image: null, attendeeCount: 18, isAttending: false },
];
export const demoStats = { members: 6, districts: 5, professions: 6, openSos: 2, upcomingEvents: 2 };
