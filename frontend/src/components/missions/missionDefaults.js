export const initialMission = {
  name: '',
  hero_subtitle: '',
  description: '',
  lore_text: '',
  group_size: 4,
  inventory_name: '',
  inventory_description: '',
  image: null,
  hero_image: null,
};

export const initialResource = { title: '', resource_type: 'YOUTUBE', url: '', file: null };

export function missionToForm(mission) {
  if (!mission) return initialMission;
  return {
    name: mission.name || '',
    hero_subtitle: mission.hero_subtitle || '',
    description: mission.description || '',
    lore_text: mission.lore_text || '',
    group_size: mission.group_size || 4,
    inventory_name: mission.inventory_name || '',
    inventory_description: mission.inventory_description || '',
    image: mission.image_url || mission.image || null,
    hero_image: mission.hero_image_url || mission.hero_image || null,
  };
}
