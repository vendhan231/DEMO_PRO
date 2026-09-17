import { Link, useParams } from "react-router-dom"

const pageContent = {
  contact: {
    title: "Contact Us",
    intro: "We are here to help with orders, accounts, and book uploads.",
    body: "Email our support team at support@bookverse.com and include your order number or account email so we can respond quickly.",
  },
  shipping: {
    title: "Shipping Policy",
    intro: "Most orders are prepared within two business days.",
    body: "Delivery times depend on your location. You will receive an order update when your package leaves our store.",
  },
  returns: {
    title: "Returns & Exchanges",
    intro: "We want every book purchase to feel right.",
    body: "Contact support within 14 days of delivery to request a return or exchange. Please keep the item in its original condition.",
  },
  privacy: {
    title: "Privacy Policy",
    intro: "Your account information stays protected.",
    body: "BookVerse uses your information to manage accounts, orders, verification, and support. We do not sell personal information.",
  },
  about: {
    title: "About BookVerse",
    intro: "BookVerse is an online bookstore for curious readers.",
    body: "Browse new releases, discover favorites, and share books with a welcoming reading community.",
  },
  careers: {
    title: "Careers",
    intro: "Help us make discovering books more personal.",
    body: "For future opportunities, send a short introduction and your area of interest to careers@bookverse.com.",
  },
  blog: {
    title: "BookVerse Blog",
    intro: "Stories, reading lists, and recommendations are coming soon.",
    body: "Check back for author spotlights, staff picks, and practical guides for building your next reading list.",
  },
}

const InfoPage = () => {
  const { slug } = useParams()
  const content = pageContent[slug] || {
    title: "BookVerse Information",
    intro: "Thanks for visiting BookVerse.",
    body: "This page contains information about our bookstore and services.",
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-white rounded-xl border border-border-light shadow-sm p-8 md:p-10">
        <p className="text-orange text-sm font-semibold uppercase tracking-wide">BookVerse</p>
        <h1 className="text-3xl font-bold text-navy mt-2 mb-4">{content.title}</h1>
        <p className="text-lg text-neutral mb-4">{content.intro}</p>
        <p className="text-neutral-light leading-7">{content.body}</p>
        <Link to="/" className="inline-block mt-8 text-orange font-medium hover:text-orange/80">
          Back to BookVerse
        </Link>
      </div>
    </div>
  )
}

export default InfoPage
