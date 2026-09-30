// Recipients for SMSEagle API. At least one of to, contacts, or groups must be provided.
export interface SMSEagleRecipients {
  to?: string[]; // phone numbers (e.g. ["+48123456789"])
  contacts?: number[]; // SMSEagle phonebook contact IDs
  groups?: number[]; // SMSEagle phonebook group IDs
}

export interface SMSEagleSmsMessage extends SMSEagleRecipients {
  body: string;
}

export interface SMSEagleRingMessage extends SMSEagleRecipients {
  duration?: number; // seconds, default 10
}

export interface SMSEagleTtsMessage extends SMSEagleRecipients {
  body: string;
  voiceId?: number;
  speed?: number; // 0.5-2.0, default 1.0
}
