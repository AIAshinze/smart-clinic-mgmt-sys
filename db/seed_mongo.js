db = db.getSiblingDB("prescriptions");

db.prescriptions.updateOne(
  { appointmentId: NumberLong(1) },
  {
    $setOnInsert: {
      patientName: "Alex Jones",
      appointmentId: NumberLong(1),
      medication: "Sample medication",
      dosage: "One dose",
      doctorNotes: "Demonstration record only"
    }
  },
  { upsert: true }
);
