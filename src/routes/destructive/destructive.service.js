// src/routes/destructive/destructive.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Performs a destructive deletion of all data associated with a specific customer.
 * This operation is irreversible.
 * @param {string} customerId - The ID of the customer to delete.
 * @returns {Promise<object>} Confirmation of deletion.
 */
async function deleteCustomerData(customerId) {
    // 1. Find the customer to ensure it exists
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
    });

    if (!customer) {
        const error = new Error('Customer not found for destructive deletion.');
        error.statusCode = 404;
        throw error;
    }

    // 2. Perform deletion in a transaction for atomicity
    try {
        const result = await prisma.$transaction([
            // Delete related ExamProgress records first (depends on cascade delete or manual order)
            prisma.examProgress.deleteMany({ where: { customerId } }),
            // Delete related Questions
            prisma.question.deleteMany({ where: { customerId } }),
            // Delete related Faculties
            prisma.faculty.deleteMany({ where: { customerId } }),
            // Delete related OtpRequestLog records
            prisma.otpRequestLog.deleteMany({ where: { userId: { in: (await prisma.user.findMany({ where: { customerId }, select: { id: true } })).map(u => u.id) } } }),
            // Delete related Users
            prisma.user.deleteMany({ where: { customerId } }),
            // Finally, delete the Customer record itself
            prisma.customer.delete({ where: { id: customerId } }),
        ]);

        console.log(`Destructive pipeline: All data for customer ID ${customerId} (${customer.name}) deleted successfully.`);
        return { message: `Customer '${customer.name}' and all associated data have been permanently deleted.`, deletedRecords: result.length };
    } catch (error) {
        console.error(`Error during destructive deletion for customer ID ${customerId}:`, error);
        const err = new Error(`Failed to perform destructive deletion: ${error.message}`);
        err.statusCode = 500;
        throw err;
    }
}

// Additional service for creating/listing customers (only for internal Super Admin)
async function createCustomer(name, adminEmail) {
    const existingCustomer = await prisma.customer.findUnique({ where: { name } });
    if (existingCustomer) {
        const error = new Error('Customer name already exists.');
        error.statusCode = 409;
        throw error;
    }
    const customer = await prisma.customer.create({
        data: { name, adminEmail }
    });
    return customer;
}

async function getAllCustomers() {
    return prisma.customer.findMany();
}

module.exports = {
    deleteCustomerData,
    createCustomer, 
    getAllCustomers,
};