function weeklyReview(weekStart) {
  var start = typeof weekStart === 'string' ? DateTime.fromString(weekStart) : weekStart;
  var end = start.plusDays(7);

  var items = ActionItem.fetch({
    filter: Filter.ge('dueDate', start).and(Filter.lt('dueDate', end)),
    include: 'this',
    limit: -1,
  }).objs || [];

  var completed = [];
  var remaining = [];
  items.each(function (item) {
    if (item.status === 'Done') {
      completed.push(item);
    } else {
      remaining.push(item);
    }
  });

  return WeeklyReview.make({
    completed: completed,
    remaining: remaining,
    completedCount: completed.length,
    remainingCount: remaining.length,
    totalCount: items.length,
    summary: completed.length + ' of ' + items.length + ' action items completed; ' + remaining.length + ' remaining.',
  });
}
