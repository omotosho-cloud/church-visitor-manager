export const ITEMS_PER_PAGE = 10;

export const MESSAGES = {
  SUCCESS: {
    MEMBER_ADDED: 'Member added successfully',
    MEMBER_UPDATED: 'Member updated successfully',
    MEMBER_DELETED: 'Member deleted',
    VISITOR_ADDED: 'Visitor added successfully',
    VISITOR_DELETED: 'Visitor deleted',
    SMS_SENT: 'SMS sent successfully',
    CSV_EXPORTED: 'CSV exported successfully',
  },
  ERROR: {
    FETCH_FAILED: 'Failed to fetch data',
    DELETE_FAILED: 'Failed to delete',
    SMS_FAILED: 'Failed to send SMS',
    INVALID_PHONE: 'Invalid phone number format',
  },
  CONFIRM: {
    DELETE_MEMBER: 'Delete this member?',
    DELETE_VISITOR: 'Delete this visitor?',
  },
};

export const PHONE_REGEX = /^[0-9]{10,15}$/;
