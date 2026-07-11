'use client';

export function SaveContactButton() {
  function download() {
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Melli Exchange',
      'ORG:Melli Exchange',
      'TITLE:Currency Exchange & Gold Jewelry',
      'TEL;TYPE=WORK,VOICE:+17787527386',
      'TEL;TYPE=WORK,TOLLFREE:+18778677090',
      'EMAIL:Info@melliexchange.ca',
      'URL:https://www.melliexchange.ca',
      'ADR;TYPE=WORK:;;Unit 1102\\, Henderson Place Mall\\, 1163 Pinetree Way;Coquitlam;BC;V3B 8A9;Canada',
      'X-SOCIALPROFILE;type=instagram:melli_jewelry_exchange',
      'END:VCARD',
    ].join('\r\n');

    const blob = new Blob([vcf], { type: 'text/vcard' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'melli-exchange.vcf';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="w-full rounded-2xl bg-gradient-to-r from-gold-500 to-amber-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-gold-900/40 transition-all hover:from-gold-400 hover:to-amber-400 active:scale-95"
    >
      Save Contact
    </button>
  );
}
