// ---------------------------------------------
// File: src/types/user.ts
// ---------------------------------------------
export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    phoneNumber?: string;
    year?: string;
    major?: string;
    instruments: string[]; // e.g. ["violin", "guitarrón"]
    sections?: string[]; // e.g. ["strings", "rhythm"]
    roles: string[]; // e.g. ["performer"], ["admin", "performer"]
    emergencyContact?: { name: string; phone: string; relation?: string };
    pronouns?: string;
    bio?: string;
    createdAt: any; // Firestore Timestamp (typed as any to avoid SDK coupling in type file)
    updatedAt: any; // Firestore Timestamp
    isReturning?: boolean;
    }