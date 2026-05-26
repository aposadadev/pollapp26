/**
 * RankingService (Functions) — Recalcula posiciones de un grupo.
 */
export function recalculate(boards) {
    // Ordenar: más puntos primero; empate → más predicciones exactas; empate → más de 1 punto
    const sorted = [...boards].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints)
            return b.totalPoints - a.totalPoints;
        if (b.predsThreePoints !== a.predsThreePoints)
            return b.predsThreePoints - a.predsThreePoints;
        return b.predsOnePoints - a.predsOnePoints;
    });
    return sorted.map((board, idx) => {
        const newPos = idx + 1;
        const prevPos = board.currentPos || newPos;
        let positionDelta = 'same';
        if (newPos < prevPos)
            positionDelta = 'up';
        else if (newPos > prevPos)
            positionDelta = 'down';
        return {
            boardId: board.id,
            boardNumber: board.boardNumber,
            userId: board.userId,
            userDisplayName: board.userDisplayName ?? '',
            totalPoints: board.totalPoints,
            predsThreePoints: board.predsThreePoints,
            predsOnePoints: board.predsOnePoints,
            currentPos: newPos,
            previousPos: prevPos,
            positionDelta
        };
    });
}
export function toBoardUpdates(entries) {
    return entries.map(e => ({
        boardId: e.boardId,
        currentPos: e.currentPos,
        previousPos: e.previousPos
    }));
}
