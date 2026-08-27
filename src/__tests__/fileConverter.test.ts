import { describe, it, expect } from 'vitest';
import { convertTxtToTiptap } from '@/lib/fileConverter';

describe('File Converter', () => {
  describe('convertTxtToTiptap', () => {
    it('should convert plain text to Tiptap JSON', () => {
      const text = 'Hello, World!';
      const result = convertTxtToTiptap(text);

      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('paragraph');
      expect(result.content[0].content[0].text).toBe('Hello, World!');
    });

    it('should handle multiple lines', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const result = convertTxtToTiptap(text);

      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(3);
      expect(result.content[0].content[0].text).toBe('Line 1');
      expect(result.content[1].content[0].text).toBe('Line 2');
      expect(result.content[2].content[0].text).toBe('Line 3');
    });

    it('should handle empty lines as empty paragraphs', () => {
      const text = 'Before\n\nAfter';
      const result = convertTxtToTiptap(text);

      expect(result.content).toHaveLength(3);
      expect(result.content[0].content[0].text).toBe('Before');
      expect(result.content[1]).toEqual({ type: 'paragraph' });
      expect(result.content[2].content[0].text).toBe('After');
    });

    it('should handle empty input', () => {
      const text = '';
      const result = convertTxtToTiptap(text);

      expect(result.type).toBe('doc');
      expect(result.content).toHaveLength(1);
    });

    it('should preserve special characters', () => {
      const text = 'Hello <World> & "Friends"';
      const result = convertTxtToTiptap(text);

      expect(result.content[0].content[0].text).toBe('Hello <World> & "Friends"');
    });
  });
});

describe('Tiptap JSON structure', () => {
  it('should produce valid Tiptap document structure', () => {
    const result = convertTxtToTiptap('Test');

    // Validate top-level structure
    expect(result).toHaveProperty('type', 'doc');
    expect(result).toHaveProperty('content');
    expect(Array.isArray(result.content)).toBe(true);

    // Validate paragraph structure
    const para = result.content[0];
    expect(para).toHaveProperty('type', 'paragraph');
    expect(para).toHaveProperty('content');
    expect(para.content[0]).toHaveProperty('type', 'text');
    expect(para.content[0]).toHaveProperty('text');
  });
});
