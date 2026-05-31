/**
 * RankingService (Functions) — Recalcula posiciones de un grupo.
 */
export function recalculate(boards) {
    // Ordenar: más puntos primero; empate → más predicciones exactas; empate → más de 1 punto; empate → más equipos clasificados adivinados
    const sorted = [...boards].sort((a, b) => {
        if (b.totalPoints !== a.totalPoints)
            return b.totalPoints - a.totalPoints;
        if (b.predsThreePoints !== a.predsThreePoints)
            return b.predsThreePoints - a.predsThreePoints;
        if (b.predsOnePoints !== a.predsOnePoints)
            return b.predsOnePoints - a.predsOnePoints;
        const bTeams = b.totalTeamsGuessed ?? 0;
        const aTeams = a.totalTeamsGuessed ?? 0;
        return bTeams - aTeams;
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
            totalTeamsGuessed: board.totalTeamsGuessed ?? 0,
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
        previousPos: e.previousPos,
        totalPoints: e.totalPoints,
        predsThreePoints: e.predsThreePoints,
        predsOnePoints: e.predsOnePoints,
        totalTeamsGuessed: e.totalTeamsGuessed ?? 0
    }));
}
