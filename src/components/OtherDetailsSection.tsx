'use client';

import { motion } from 'framer-motion';
import { getImageUrl, CloudinaryPresets } from '@/lib/cloudinary';

export default function OtherDetailsSection() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-warm-beige/5 to-dusty-rose/10 relative py-16 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url(${getImageUrl('weddingimgs', 'img16.jpg', CloudinaryPresets.background)})`,
          opacity: 0.08,
          transform: 'scale(1.1)'
        }}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">

        {/* Section Header */}
        <motion.div
          className="text-center items-center justify-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden mb-5">
            <img 
              src={getImageUrl('imgs', 'monogram-flower-black.png', CloudinaryPresets.highQuality)} 
              alt="MJ & Erica Monogram" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-6xl md:text-6xl font-parisienne text-slate-blue mb-8">
            Other Details
          </h2>
          <p className="text-2xl font-parisienne text-black mb-8">
            Important Information
          </p>

          {/* Decorative Flourish */}
          <motion.div
            className="flex justify-center items-center mb-8"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <svg className="w-48 h-4 text-sage-green" viewBox="0 0 200 20" fill="currentColor">
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

        <div className="space-y-16">

          {/* 1 & 2. Gift Note and Snap & Share - Side by Side */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Gift Note */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-sage-green/20 h-full">
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto text-sage-green" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
                  </svg>
                </div>
                <h3 className="text-2xl md:text-3xl font-playfair text-slate-blue mb-6">
                  Gift Note
                </h3>
                <p className="text-base text-slate-blue/80 leading-relaxed">
                  We would prefer your presence not your presents, but if you would like to give us a gift to help us start our married life, then gift of cash would be greatly appreciated. We look forward to celebrating our wedding day with you.
                </p>
              </div>
            </motion.div>

            {/* Snap & Share */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl border border-dusty-rose/20 h-full flex flex-col justify-between">
                <div>
                  <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-dusty-rose" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-playfair text-slate-blue mb-6">
                    Snap & Share
                  </h3>
                  <p className="text-base text-slate-blue/80 leading-relaxed mb-6">
                    Help us capture the love! Please scan the qr code in provided in your table and upload your photos on the website so we can document our best day ever!
                  </p>
                </div>
                <div className="bg-gradient-to-r from-dusty-rose to-sage-green text-black px-6 py-3 rounded-full inline-block text-xl font-cormorant">
                  #iMJenuinelymeantforECA
                </div>
              </div>
            </motion.div>
          </div>

          {/* 3. Payment QR Codes */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-warm-beige/20 max-w-6xl mx-auto">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-slate-blue" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0v14h14V5H5zm2 2h2v2H7V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zM7 11h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM7 15h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                </svg>
              </div>
              <h3 className="text-3xl md:text-4xl font-playfair text-slate-blue mb-6">
                QR Codes
              </h3>
              <p className="text-lg text-slate-blue/80 leading-relaxed mb-8">
                Instead of traditional gifts, please consider donating to our future adventures by scanning the QR codes below. Your support means the world to us.
              </p>

              {/* QR Codes Side by Side */}
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* GCash QR Code - MJ */}
                <div className="flex flex-col items-center">
                  {/* Account Details */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6 w-full border border-green-200">
                    <div className="text-center space-y-2">
                      <div className="text-xl font-semibold text-green-800">MA*K JA***N D.</div>
                      <div className="text-lg text-green-700">Mobile: 0915119••••</div>
                      <div className="text-sm text-green-600">User ID: ••••••••X0M341</div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-green-100">
                    <img
                      src={getImageUrl('imgs', 'gcash-qr.png', CloudinaryPresets.highQuality)}
                      alt="GCash QR Code"
                      className="w-56 h-56 object-contain mx-auto"
                    />
                    <p className="text-sm text-slate-blue/60 mt-4 font-medium">
                      Scan to send via GCash
                    </p>
                  </div>
                </div>

                {/* Dollar Account QR Code - Erica */}
                <div className="flex flex-col items-center">
                  {/* Account Details */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 w-full border border-blue-200">
                    <div className="text-center space-y-2">
                      <div className="text-xl font-semibold text-blue-800">Erica Mae De Castro Pineda</div>
                      <div className="text-lg text-blue-700">Acleda Bank</div>
                      <div className="text-sm text-blue-600">Dollar Account</div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-100">
                    <img
                      src={getImageUrl('imgs', 'dollar-account-qr.png', CloudinaryPresets.highQuality)}
                      alt="Dollar Account QR Code"
                      className="w-56 h-56 object-contain mx-auto"
                    />
                    <p className="text-sm text-slate-blue/60 mt-4 font-medium">
                      Scan to send to Dollar Account
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
