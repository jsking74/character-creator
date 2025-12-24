import PDFDocument from 'pdfkit';
import { Character } from '../models/Character.js';
import { CharacterData } from '@character-creator/shared';

export class PdfService {
  private calculateAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  private formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  private calculateProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
  }

  generateCharacterSheet(character: Character): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
    });

    const pageWidth = 612 - 100; // Letter width minus margins
    const data = character.character_data;
    const profBonus = this.calculateProficiencyBonus(data.basics.level);

    // Header
    this.drawHeader(doc, character, data, profBonus);

    // Ability Scores Section
    this.drawAbilityScores(doc, data);

    // Combat Stats
    this.drawCombatStats(doc, data, profBonus);

    // Character Details
    this.drawCharacterDetails(doc, character, data, pageWidth);

    // Backstory (if exists)
    if (data.backstory.description) {
      this.drawBackstory(doc, data, pageWidth);
    }

    // Footer
    this.drawFooter(doc, character);

    return doc;
  }

  private drawHeader(doc: PDFKit.PDFDocument, character: Character, data: CharacterData, profBonus: number): void {
    // Character Name
    doc.fontSize(28).font('Helvetica-Bold').text(character.name, { align: 'center' });
    doc.moveDown(0.3);

    // Class, Race, Level
    doc.fontSize(14).font('Helvetica')
      .text(`Level ${data.basics.level} ${data.basics.race} ${data.basics.class}`, { align: 'center' });
    doc.moveDown(0.2);

    // System and Alignment
    doc.fontSize(10).fillColor('#666666')
      .text(`${character.system_id.toUpperCase()} | ${data.basics.alignment || 'Unaligned'} | Proficiency Bonus: +${profBonus}`, { align: 'center' });
    doc.fillColor('#000000');

    // Horizontal line
    doc.moveDown(0.5);
    const y = doc.y;
    doc.moveTo(50, y).lineTo(562, y).stroke();
    doc.moveDown(1);
  }

  private drawAbilityScores(doc: PDFKit.PDFDocument, data: CharacterData): void {
    const abilities = [
      { name: 'STR', score: data.attributes.strength },
      { name: 'DEX', score: data.attributes.dexterity },
      { name: 'CON', score: data.attributes.constitution },
      { name: 'INT', score: data.attributes.intelligence },
      { name: 'WIS', score: data.attributes.wisdom },
      { name: 'CHA', score: data.attributes.charisma },
    ];

    doc.fontSize(12).font('Helvetica-Bold').text('ABILITY SCORES', { underline: true });
    doc.moveDown(0.5);

    const startX = 50;
    const boxWidth = 80;
    const boxHeight = 60;
    const spacing = 5;
    const startY = doc.y;

    abilities.forEach((ability, index) => {
      const x = startX + (index * (boxWidth + spacing));
      const mod = this.calculateAbilityModifier(ability.score);

      // Draw box
      doc.rect(x, startY, boxWidth, boxHeight).stroke();

      // Ability name
      doc.fontSize(10).font('Helvetica-Bold')
        .text(ability.name, x, startY + 5, { width: boxWidth, align: 'center' });

      // Score (large)
      doc.fontSize(20).font('Helvetica-Bold')
        .text(ability.score.toString(), x, startY + 18, { width: boxWidth, align: 'center' });

      // Modifier
      doc.fontSize(12).font('Helvetica')
        .text(this.formatModifier(mod), x, startY + 42, { width: boxWidth, align: 'center' });
    });

    doc.y = startY + boxHeight + 20;
  }

  private drawCombatStats(doc: PDFKit.PDFDocument, data: CharacterData, _profBonus: number): void {
    doc.fontSize(12).font('Helvetica-Bold').text('COMBAT', { underline: true });
    doc.moveDown(0.5);

    const startX = 50;
    const startY = doc.y;
    const boxWidth = 120;
    const boxHeight = 50;

    // Hit Points Box
    doc.rect(startX, startY, boxWidth, boxHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold')
      .text('HIT POINTS', startX, startY + 5, { width: boxWidth, align: 'center' });
    doc.fontSize(18).font('Helvetica-Bold')
      .text(`${data.hitPoints.current} / ${data.hitPoints.maximum}`, startX, startY + 20, { width: boxWidth, align: 'center' });
    if (data.hitPoints.temporary > 0) {
      doc.fontSize(10).font('Helvetica')
        .text(`+${data.hitPoints.temporary} temp`, startX, startY + 38, { width: boxWidth, align: 'center' });
    }

    // Armor Class Box
    const dexMod = this.calculateAbilityModifier(data.attributes.dexterity);
    const baseAC = 10 + dexMod;
    doc.rect(startX + boxWidth + 10, startY, boxWidth, boxHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold')
      .text('ARMOR CLASS', startX + boxWidth + 10, startY + 5, { width: boxWidth, align: 'center' });
    doc.fontSize(22).font('Helvetica-Bold')
      .text(baseAC.toString(), startX + boxWidth + 10, startY + 18, { width: boxWidth, align: 'center' });

    // Initiative Box
    doc.rect(startX + (boxWidth + 10) * 2, startY, boxWidth, boxHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold')
      .text('INITIATIVE', startX + (boxWidth + 10) * 2, startY + 5, { width: boxWidth, align: 'center' });
    doc.fontSize(22).font('Helvetica-Bold')
      .text(this.formatModifier(dexMod), startX + (boxWidth + 10) * 2, startY + 18, { width: boxWidth, align: 'center' });

    // Speed Box
    doc.rect(startX + (boxWidth + 10) * 3, startY, boxWidth, boxHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold')
      .text('SPEED', startX + (boxWidth + 10) * 3, startY + 5, { width: boxWidth, align: 'center' });
    doc.fontSize(18).font('Helvetica-Bold')
      .text('30 ft', startX + (boxWidth + 10) * 3, startY + 20, { width: boxWidth, align: 'center' });

    doc.y = startY + boxHeight + 20;
  }

  private drawCharacterDetails(doc: PDFKit.PDFDocument, character: Character, data: CharacterData, _pageWidth: number): void {
    doc.fontSize(12).font('Helvetica-Bold').text('CHARACTER DETAILS', { underline: true });
    doc.moveDown(0.5);

    const details = [
      ['Background', data.basics.background || 'None'],
      ['Gold', `${data.currency.gold} gp`],
      ['Visibility', character.is_public ? 'Public' : 'Private'],
    ];

    details.forEach(([label, value]) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`${label}: `, { continued: true })
        .font('Helvetica').text(value);
    });

    doc.moveDown(1);
  }

  private drawBackstory(doc: PDFKit.PDFDocument, data: CharacterData, pageWidth: number): void {
    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(12).font('Helvetica-Bold').text('BACKSTORY', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica')
      .text(data.backstory.description || '', {
        width: pageWidth,
        align: 'left',
        lineGap: 2,
      });

    doc.moveDown(1);
  }

  private drawFooter(doc: PDFKit.PDFDocument, character: Character): void {
    const bottomY = 720;

    doc.fontSize(8).fillColor('#999999')
      .text(
        `Generated by Character Creator | Created: ${new Date(character.created_at).toLocaleDateString()} | Updated: ${new Date(character.updated_at).toLocaleDateString()}`,
        50,
        bottomY,
        { align: 'center', width: 512 }
      );
  }
}
