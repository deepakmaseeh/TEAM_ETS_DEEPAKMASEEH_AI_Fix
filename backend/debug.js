
console.log("Starting debug...");

const debug = async () => {
    try {
        console.log("Importing express...");
        await import('express');
        console.log("Express imported.");
    } catch (e) {
        console.error("Failed to import express:", e);
    }

    try {
        console.log("Importing dotenv...");
        await import('dotenv');
        console.log("Dotenv imported.");
    } catch (e) {
        console.error("Failed to import dotenv:", e);
    }

    try {
        console.log("Importing local utils...");
        await import('./src/utils/storage.js');
        console.log("Storage imported.");
    } catch (e) {
        console.error("Failed to import storage.js:", e);
    }
};

debug().then(() => console.log("Debug finished."));
