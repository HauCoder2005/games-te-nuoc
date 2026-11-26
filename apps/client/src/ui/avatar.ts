import { CHARACTER_VARIANTS, TEAM_COLORS } from '@te-nuoc/shared';
import type { Team } from '@te-nuoc/shared';

const SVG_NS = 'http://www.w3.org/2000/svg';

function rect(x: number, y: number, w: number, h: number, fill: string): SVGRectElement {
  const element = document.createElementNS(SVG_NS, 'rect');
  element.setAttribute('x', String(x));
  element.setAttribute('y', String(y));
  element.setAttribute('width', String(w));
  element.setAttribute('height', String(h));
  element.setAttribute('fill', fill);
  return element;
}

export function createCharacterAvatar(variantId: number, team: Team | 'casual' = 'casual'): SVGSVGElement {
  const variant = CHARACTER_VARIANTS[variantId] ?? CHARACTER_VARIANTS[0];
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 18 22');
  svg.setAttribute('class', 'char-avatar-svg');
  const outline = '#2B1E2F';
  const uniformColor = team === 'casual'
    ? (variant.id === 0 ? '#FF7A59' : variant.id === 1 ? '#A56EFF' : variant.id === 2 ? '#2EC4B6' : variant.id === 3 ? '#FF6B9D' : '#4CC9F0')
    : TEAM_COLORS[team];
  const capColor = team === 'casual' ? variant.hair : TEAM_COLORS[team];

  // Back/side hair for female or curly hairstyles
  if (variant.hairStyle === 'pigtails') {
    svg.append(
      rect(1, 7, 3, 8, outline), rect(14, 7, 3, 8, outline),
      rect(2, 8, 2, 6, variant.hair), rect(14, 8, 2, 6, variant.hair),
      rect(3, 7, 1, 1, variant.goggle), rect(14, 7, 1, 1, variant.goggle),
    );
  } else if (variant.hairStyle === 'long') {
    svg.append(
      rect(2, 7, 2, 10, outline), rect(14, 7, 2, 10, outline),
      rect(3, 7, 2, 9, variant.hair), rect(13, 7, 2, 9, variant.hair),
    );
  } else if (variant.hairStyle === 'ponytail') {
    svg.append(
      rect(14, 5, 3, 7, outline),
      rect(14, 6, 2, 5, variant.hair),
    );
  } else if (variant.hairStyle === 'curly') {
    svg.append(
      rect(2, 6, 2, 5, variant.hair), rect(14, 6, 2, 5, variant.hair),
    );
  }

  // Head & cap outline
  svg.append(
    rect(5, 1, 8, 1, outline),
    rect(4, 2, 10, 1, outline),
    rect(3, 3, 12, 10, outline),
    rect(4, 13, 10, 1, outline),
  );

  // Swim cap / top hair
  svg.append(
    rect(5, 2, 8, 1, capColor),
    rect(4, 3, 10, 4, capColor),
  );

  // Goggles on cap
  svg.append(
    rect(4, 5, 10, 1, '#2B2B33'),
    rect(5, 5, 2, 2, variant.goggle),
    rect(11, 5, 2, 2, variant.goggle),
  );

  // Face skin
  svg.append(
    rect(4, 7, 10, 6, variant.skin),
    rect(3, 8, 1, 3, variant.skinShade),
    rect(14, 8, 1, 3, variant.skinShade),
  );

  // Hair bangs under cap
  svg.append(
    rect(4, 7, 2, 2, variant.hair),
    rect(12, 7, 2, 2, variant.hair),
  );
  if (variant.hairStyle === 'spiky') {
    svg.append(rect(6, 7, 2, 1, variant.hair), rect(10, 7, 2, 1, variant.hair));
  } else if (variant.hairStyle === 'curly') {
    svg.append(rect(6, 7, 6, 1, variant.hair));
  } else if (variant.hairStyle === 'ponytail' || variant.hairStyle === 'pigtails') {
    svg.append(rect(6, 7, 1, 1, variant.hair), rect(11, 7, 1, 1, variant.hair));
  }

  // Eyes & expression
  svg.append(
    rect(6, 9, 1, 2, outline),
    rect(11, 9, 1, 2, outline),
    rect(8, 11, 2, 1, '#82603F'),
  );
  if (variant.gender === 'female') {
    svg.append(
      rect(5, 11, 1, 1, variant.blush),
      rect(12, 11, 1, 1, variant.blush),
    );
  }

  // Shirt / Team Jersey
  svg.append(
    rect(3, 14, 12, 6, outline),
    rect(4, 14, 10, 5, uniformColor),
    rect(8, 14, 2, 1, variant.skin),
    rect(5, 16, 8, 1, '#F4F4F4'),
    rect(8, 18, 2, 1, '#F4F4F4'),
    rect(3, 15, 1, 4, variant.skin),
    rect(14, 15, 1, 4, variant.skinShade),
  );

  return svg;
}
