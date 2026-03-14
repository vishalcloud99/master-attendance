/**
 * Backend Configuration and API Wrapper
 */
const CONFIG = {
    // TODO: The USER MUST REPLACE THESE WITH THEIR DEPLOYED GOOGLE APPS SCRIPT WEB APP URLs
    ATTENDANCE_API_URL: "https://script.google.com/macros/s/AKfycbyl8Ykdc_cmrwrHSDdqX90__31m5zNjWOvN1FOX--ecpNeMK0FxzLW-z86BwCPUpBLiDA/exec",
    EXPENSE_API_URL: "https://script.google.com/macros/s/AKfycbyzeVVsynmA5q1CPP_skDIAgqe_MUUCQVubrLDKh2hyMlci786lfK669J2xYJ9luD0_/exec",
};

/**
 * Handles all requests to the Google Apps Script backend.
 */
class ApiService {
    /**
     * Send a POST request to the backend with form data.
     * @param {string} action The action to perform (e.g., 'submitAttendance')
     * @param {Object} data The data payload to send
     * @returns {Promise<Object>} The response object
     */
    static async post(action, data) {
        const targetUrl = (action === 'submitExpense') ? CONFIG.EXPENSE_API_URL : CONFIG.ATTENDANCE_API_URL;
        
        try {
            const response = await fetch(targetUrl, {
                method: 'POST',
                // Using text/plain avoids the CORS preflight OPTIONS request
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    action: action,
                    payload: data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            
            return result;

        } catch (error) {
            console.error(`API Error (${action}):`, error);
            throw error;
        }
    }

    /**
     * Send a GET request to the backend.
     * @param {string} action The action to perform (e.g., 'getVisits')
     * @param {Object} params Additional URL parameters
     * @returns {Promise<Object>} The response object
     */
    static async get(action, params = {}) {
        const targetUrl = (action === 'getExpenses') ? CONFIG.EXPENSE_API_URL : CONFIG.ATTENDANCE_API_URL;
        
        try {
            const url = new URL(targetUrl);
            url.searchParams.append('action', action);
            
            for (const [key, value] of Object.entries(params)) {
                url.searchParams.append(key, value);
            }

            const response = await fetch(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.status === 'error') {
                throw new Error(result.message);
            }
            
            return result;

        } catch (error) {
            console.error(`API Error (${action}):`, error);
            throw error;
        }
    }
}
