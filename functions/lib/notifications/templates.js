// ── match_reminder ─────────────────────────────────────────────────────────────
const matchReminderTemplate = {
  build(data) {
    const hoursText = data.hoursAhead === 1 ? '1 hora' : `${data.hoursAhead} horas`
    return {
      notification: {
        title: `⚽ ${data.localTeamName} vs ${data.visitorTeamName}`,
        body: `El partido empieza en ${hoursText} (${data.matchTime}). ¡No olvides poner tu pronóstico!`
      },
      data: {
        url: '/', // La Cloud Function reemplaza esto con la URL del board
        tag: `match-reminder-${data.matchId}`,
        type: 'match_reminder',
        matchId: data.matchId
      }
    }
  }
}
// ── Registro de templates ──────────────────────────────────────────────────────
// Agrega nuevos templates aquí para que sean reconocidos por el sender.

export const TEMPLATES = {
  match_reminder: matchReminderTemplate
  // match_started: matchStartedTemplate,
  // match_closed: matchClosedTemplate,
}
