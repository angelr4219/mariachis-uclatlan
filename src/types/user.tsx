// src/types/user.ts
export interface EmergencyContact {
    name: string;
    phone: string;
    relation?: string;
    }
    
    
    export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    phoneNumber?: string;
    year?: string;
    major?: string;
    instruments: string[]; // required field in our profile
    sections?: string[];
    roles: string[]; // e.g., ['performer'] | ['admin'] | ...
    emergencyContact?: EmergencyContact;
    pronouns?: string;
    bio?: string;
    isReturning?: boolean;
    createdAt?: any; // Firestore Timestamp or Date; keep loose to avoid SDK typing friction
    updatedAt?: any;
    }