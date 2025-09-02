'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQSectionProps {
  openFAQIndex: number | null;
  setOpenFAQIndex: (index: number | null) => void;
}

export default function FAQSection({ openFAQIndex, setOpenFAQIndex }: FAQSectionProps) {
  const faqs = [
    {
      question: "Do we really need RSVP?",
      answer: "YES, PLEASE!\nTo make sure you are included on our final guest list, please confirm your attendance via private message or e-invitation before December 10, 2025.\n\nMJ: 09151193424\nErica: 09274731596",
      color: "sage-green"
    },
    {
      question: "Can I bring someone else to your wedding with me?",
      answer: "Please understand that your invitation is exclusively for you, and we are unable to extend invitations to additional guests. If you have any concerns, please send us a message.",
      color: "dusty-rose"
    },
    {
      question: "Can we bring our kids?",
      answer: "While we both love kids, this is an adult-only occasion, only those who are part of the entourage are invited to our wedding. Thank you for understanding.",
      color: "warm-beige"
    },
    {
      question: "What time should we be there?",
      answer: "The ceremony will start at exactly 11:00 AM.\nEntourage should be there at 10:30 AM.\nGuests are expected to arrive 30 minutes before the ceremony. Traffic and travel time should be considered.",
      color: "slate-blue"
    },
    {
      question: "When is the appropriate time to leave?",
      answer: "It would be much appreciated if you stay until the end of the program. We have planned to have this lovely wedding together with our selected guests. Please do not eat and run! kidding 😊",
      color: "sage-green"
    },
    {
      question: "How can we help the couple have the best time during their wedding?",
      answer: "• Pray for us.\n• RSVP and don't be late.\n• Dress appropriately.\n• Share photos/videos and use our hashtag #JOANsweredprayerofERIC.\n• Stay until the end of the program.",
      color: "dusty-rose"
    },
    {
      question: "Do we have after party?",
      answer: "Yes we do have a party after. We have a DJ and mobile bar after the wedding program so please stay.",
      color: "warm-beige"
    }
  ];

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-blue/5 via-white to-sage-green/5 relative py-16">
      <div className="max-w-6xl mx-auto px-6 w-full">

        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-xl md:text-2xl font-playfair text-slate-blue/70 mb-4 tracking-widest">
            MJ & ERICA
          </div>
          <h2 className="text-5xl md:text-6xl font-playfair text-slate-blue mb-4 tracking-wide">
            FREQUENTLY ASKED
          </h2>
          <p className="text-2xl font-playfair text-dusty-rose mb-8">
            Questions & Answers
          </p>

          {/* Decorative Flourish */}
          <motion.div
            className="flex justify-center items-center mb-8"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            viewport={{ once: true }}
          >
            <svg className="w-48 h-4 text-slate-blue" viewBox="0 0 200 20" fill="currentColor">
              <path d="M10,10 Q50,2 100,10 Q150,18 190,10" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" />
              <circle cx="20" cy="10" r="1.5" />
              <circle cx="40" cy="8" r="1" />
              <circle cx="60" cy="12" r="1" />
              <circle cx="80" cy="8" r="1.5" />
              <circle cx="100" cy="10" r="2" />
              <circle cx="120" cy="12" r="1.5" />
              <circle cx="140" cy="8" r="1" />
              <circle cx="160" cy="12" r="1" />
              <circle cx="180" cy="8" r="1.5" />
            </svg>
          </motion.div>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto space-y-6">
          
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className={`bg-white rounded-2xl shadow-xl border border-${faq.color}/20 overflow-hidden`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <button
                className={`w-full px-8 py-6 text-left flex items-center justify-between hover:bg-${faq.color}/5 transition-colors`}
                onClick={() => setOpenFAQIndex(openFAQIndex === index ? null : index)}
              >
                <h3 className="text-xl font-playfair text-slate-blue">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openFAQIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`text-${faq.color}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </button>
              <AnimatePresence>
                {openFAQIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-6 text-slate-blue/80 leading-relaxed">
                      <div className="whitespace-pre-line">{faq.answer}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

        </div>

        {/* Contact for More Questions */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-sage-green/10 via-dusty-rose/10 to-warm-beige/10 rounded-2xl p-8 max-w-3xl mx-auto">
            <h4 className="text-2xl font-playfair text-slate-blue mb-4">Still have questions?</h4>
            <p className="text-slate-blue/80 leading-relaxed mb-6">
              Feel free to reach out to us directly. We're happy to help with any additional questions or concerns you may have.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <p className="font-semibold text-slate-blue mb-3">MJ</p>
                <a href="tel:+639151193424" className="text-sage-green hover:text-sage-green/80 transition-colors block">
                  📞 09151193424
                </a>
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-blue mb-3">Erica</p>
                <a href="tel:+639274731596" className="text-dusty-rose hover:text-dusty-rose/80 transition-colors block">
                  📞 09274731596
                </a>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
