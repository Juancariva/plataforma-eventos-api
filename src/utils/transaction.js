import mongoose from 'mongoose';

export const withDatabaseTransaction = async (operation) => {
  try {
    return await mongoose.connection.transaction(operation, {
      readPreference: 'primary',
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' }
    });
  } catch (error) {
    if (error.code === 20 && error.message.includes('Transaction numbers')) {
      const configurationError = new Error('El control de cupos requiere MongoDB con replica set');
      configurationError.statusCode = 503;
      throw configurationError;
    }

    throw error;
  }
};
