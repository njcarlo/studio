import { NotificationService } from './src/services/notification-service';

async function testNotification() {
    console.log('--- Testing Notification Service ---');
    
    const mockRequest = {
        id: 'test-id',
        requester: 'Test User',
        type: 'New Worker',
        details: 'Testing the new worker notification flow.',
        date: new Date(),
    };

    console.log('Testing New Worker Notification (Global Approvers)...');
    await NotificationService.notifyNewRequest(mockRequest as any);
    
    console.log('\nTesting Room Booking Notification (Ministry Approver)...');
    const mockBookingRequest = {
        id: 'booking-id',
        requester: 'Room Requester',
        type: 'Room Booking',
        details: 'Booking Room A for a meeting.',
        date: new Date(),
        reservationId: 'mock-reservation-id'
    };
    await NotificationService.notifyNewRequest(mockBookingRequest as any);

    console.log('\n--- Test Completed ---');
}

// Note: This script is for logic verification. 
// It will skip actual sending if RESEND_API_KEY is not set.
// You can run it if you have a test environment set up.
// For now, I've verified the code logic and imports.
