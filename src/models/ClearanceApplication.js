import mongoose from 'mongoose';
import { generateId } from '../lib/idGenerator.js';

// Payment subdocument schema
const paymentSchema = new mongoose.Schema({
    processor: {
        type: String,
        required: false
    },
    transaction_id: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false,
        default: 'pending'
    }
}, { _id: false });

const clearanceApplicationSchema = new mongoose.Schema({
    custom_id: {
        type: String,
        unique: true,
        required: true,
        default: () => generateId('CLR')
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    station_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PoliceStation',
        required: false
    },
    purpose: {
        type: String,
        required: true,
    },
    appointment_date: {
        type: Date,
        required: false
    },
    price: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        required: true,
        default: 'pending'
    },
    payment: {
        type: paymentSchema,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update updated_at before saving and ensure custom_id
clearanceApplicationSchema.pre('save', async function(next) {
    this.updated_at = Date.now();

    if (!this.custom_id) {
        let id;
        let exists;
        do {
            id = generateId('CLR');
            exists = await this.constructor.findOne({ custom_id: id });
        } while (exists);
        this.custom_id = id;
    }

    next();
});

const ClearanceApplication = mongoose.model('ClearanceApplication', clearanceApplicationSchema);

export default ClearanceApplication;

