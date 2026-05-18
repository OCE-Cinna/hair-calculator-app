
function simulatePoints(densityVal, thicknessScale) {
    const DENSITY_COUNTS = { 1: 16, 2: 32, 3: 48, 4: 64, 5: 80, 6: 120, 7: 180 };
    let targetCount = DENSITY_COUNTS[densityVal] || 60;
    const thicknessRatio = 0.07 / Math.max(0.01, thicknessScale);
    targetCount = Math.floor(targetCount * Math.sqrt(thicknessRatio));

    const densityFactor = Math.sqrt(targetCount);
    const rowCount = Math.floor(densityFactor * 1.5);
    const basePointsPerRow = densityFactor * 2.2;

    let totalCandidates = 0;
    for (let r = 0; r <= rowCount; r++) {
        const phi = (r / rowCount) * 1.5;
        let ptsInRow = Math.floor(basePointsPerRow * Math.sin(phi));
        ptsInRow = Math.max(1, ptsInRow);
        if (ptsInRow > 1 && ptsInRow % 2 !== 0) ptsInRow += 1;
        
        for (let t = 0; t < ptsInRow; t++) {
            const baseTheta = (t / ptsInRow) * Math.PI * 2;
            const tempZ = Math.sin(phi) * Math.sin(baseTheta);
            const isBack = tempZ < 0;
            const spawns = isBack ? 2 : 1;
            totalCandidates += spawns;
        }
    }
    return { targetCount, totalCandidates };
}

console.log("Low Density, Jumbo Thickness (Density 1, Scale 0.25):", simulatePoints(1, 0.25));
console.log("High Density, Micro Thickness (Density 7, Scale 0.02):", simulatePoints(7, 0.02));
console.log("Medium Density, Medium Thickness (Density 4, Scale 0.07):", simulatePoints(4, 0.07));
