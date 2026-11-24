export function totalWeight(attendance, rubrics) {
    return (toHundredths(attendance) + Object.values(rubrics)
        .reduce((total, value) => total + toHundredths(value), 0)) / 100;
}

function toHundredths(value) {
    return Math.round(Number(value) * 100);
}
