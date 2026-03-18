import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>juanemo.com</span>
      <span>&copy; 2026 Juan-Carlos Morales</span>
      <div className={styles.links}>
        <a href="mailto:hello@juanemo.com">Email</a>
        <a
          href="https://www.linkedin.com/in/jmorales273/"
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
}
