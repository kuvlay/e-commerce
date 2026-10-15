const Title = ({ text1, text2 }) => {
  return (
    <div className="inline-flex gap-2 items-center mb-2">
      <p style={{ color: 'var(--text-tertiary)' }}>
        {text1} <span style={{ color: 'var(--text-secondary)' }} className="font-medium">{text2}</span>{" "}
      </p>
      <p className="w-8 sm:w-12 h-[1px] sm:h-[2px]" style={{ backgroundColor: 'var(--primary-500)' }}></p>
    </div>
  );
};

export default Title;
