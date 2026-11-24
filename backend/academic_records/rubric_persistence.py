from rest_framework.exceptions import ValidationError

from .models import Grade, RubricCriterion, RubricLevel


def save_criteria(rubric, criteria):
    current = list(rubric.criteria.prefetch_related('levels'))
    by_id = {criterion.pk: criterion for criterion in current}
    referenced = {item['id'] for item in criteria if 'id' in item}
    used = set()
    has_grades = Grade.objects.filter(evaluation__rubric=rubric).exists()

    for index, item in enumerate(criteria):
        pk = item.get('id')
        if pk is not None and (pk not in by_id or pk in used):
            raise ValidationError({'criteria': 'El criterio no pertenece a la rúbrica o está repetido.'})
        criterion = by_id.get(pk)
        if pk is None:
            # Older clients omit IDs. Match unclaimed criteria with the same name.
            criterion = next((old for old in current if old.pk not in referenced | used
                              and old.name == item['name']), None)
        values = [level['value'] for level in item['levels']]
        if not values or len(set(values)) != len(values) or min(values) < 1:
            raise ValidationError({'criteria': 'Cada criterio requiere niveles positivos y distintos.'})
        old_values = {level.value for level in criterion.levels.all()} if criterion else set()
        if has_grades and set(values) != old_values:
            raise ValidationError({'criteria': 'Una rúbrica calificada conserva sus criterios y niveles.'})
        if criterion is None:
            criterion = RubricCriterion(rubric=rubric)
        criterion.name = item['name']
        criterion.order = item.get('order', index)
        criterion.save()
        used.add(criterion.pk)
        for level in item['levels']:
            RubricLevel.objects.update_or_create(
                criterion=criterion, value=level['value'],
                defaults={'description': level.get('description', '')},
            )
        criterion.levels.exclude(value__in=values).delete()

    removed = set(by_id) - used
    if has_grades and removed:
        raise ValidationError({'criteria': 'Una rúbrica calificada conserva sus criterios y niveles.'})
    rubric.criteria.filter(pk__in=removed).delete()
